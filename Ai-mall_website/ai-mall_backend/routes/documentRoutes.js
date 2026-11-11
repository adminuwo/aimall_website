/**
 * Document Routes — Upload, process, list, delete, reprocess
 */
const express   = require('express');
const multer    = require('multer');
const path      = require('path');
const { v4: uuidv4 } = require('uuid');
const Document  = require('../models/Document');
const { verifyToken, requireAdmin, requireViewer } = require('../middleware/auth');
const { extractText, chunkText, detectLanguage }   = require('../services/documentProcessor');
const { generateEmbeddingsBatch }                  = require('../services/embeddingService');
const { upsertVectors, deleteVectors }             = require('../services/vectorService');
const { storeFile, deleteLocalFile, UPLOAD_DIR }   = require('../services/storageService');
const { fireWebhook }                              = require('../services/webhookService');

const router = express.Router();

// ── Multer Config ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename:    (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${uuidv4()}_${safe}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'];
        if (allowed.includes(file.mimetype) ||
            ['.pdf','.txt','.docx','.doc'].includes(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
        }
    }
});

// ── Background processing function ──────────────────────────────────────────
async function processDocument(id) {
    try {
        const doc = await Document.findById(id);
        if (!doc) return;

        doc.status = 'processing';
        await doc.save();

        // 1. Extract text
        const text     = await extractText(doc.path, doc.mimeType);
        const language = detectLanguage(text);

        // 2. Chunk
        const chunks = chunkText(text);
        if (chunks.length === 0) throw new Error('No text content extracted');

        // 3. Generate embeddings
        const texts      = chunks.map(c => c.content);
        const embeddings = await generateEmbeddingsBatch(texts);
        chunks.forEach((c, i) => { c.embedding = embeddings[i] || []; });

        // 4. Update MongoDB
        doc.status        = 'processed';
        doc.chunks        = chunks;
        doc.chunkCount    = chunks.length;
        doc.language      = language;
        doc.processed_at  = new Date();
        await doc.save();

        console.log(`✅ Document processed: ${doc.originalName} → ${chunks.length} chunks`);
    } catch (err) {
        console.error(`❌ Processing failed for document ${id}:`, err.message);
        await Document.findByIdAndUpdate(id, { status: 'error', error: err.message });
    }
}

// ── POST /api/documents/upload ────────────────────────────────────────────────
router.post('/upload', verifyToken, requireAdmin, upload.single('document'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    try {
        const { url, storageType } = await storeFile(req.file.path, req.file.originalname);
        
        const doc = await Document.create({
            filename:     req.file.filename,
            originalName: req.file.originalname,
            mimeType:     req.file.mimetype,
            fileSize:     req.file.size,
            path:         req.file.path,
            storageUrl:   url,
            storageType,
            status:       'pending',
            uploadedBy:   req.user.username,
            created_at:    new Date()
        });

        // Process asynchronously
        processDocument(doc._id).catch(console.error);

        res.json({ success: true, document: { id: doc._id, filename: doc.originalName, status: doc.status } });
    } catch (err) {
        console.error('❌ Upload Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/documents ────────────────────────────────────────────────────────
router.get('/', verifyToken, requireViewer, async (req, res) => {
    try {
        const docs = await Document.find().sort({ created_at: -1 });
        const formatted = docs.map(d => ({
            _id: d._id,
            filename: d.originalName,
            status: d.status,
            chunks: d.chunks || [],
            created_at: d.created_at,
            extension: (d.originalName || '').split('.').pop(),
            publicUrl: d.url || (d.path ? `/uploads/${path.basename(d.path)}` : '#'),
            storagePath: d.path || '#'
        }));
        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('❌ Document List Error:', err.message);
        res.status(500).json({ success: false, error: err.message, data: [] });
    }
});

// ── GET /api/documents/:id ────────────────────────────────────────────────────
router.get('/:id', verifyToken, requireViewer, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id).select('-chunks');
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
        res.json({ success: true, document: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /api/documents/:id/reprocess ────────────────────────────────────────
router.post('/:id/reprocess', verifyToken, requireAdmin, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        res.json({ success: true, message: 'Reprocessing started' });
        processDocument(doc._id).catch(console.error);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── DELETE /api/documents/:id ─────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        await deleteVectors(doc._id, doc.chunkCount);
        deleteLocalFile(path.basename(doc.path));
        
        await Document.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

module.exports = router;
