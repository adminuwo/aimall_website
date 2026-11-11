const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const path       = require('path');
const fs         = require('fs');

const { aiInstance, modelName } = require('./config/vertex');

// ── Routes ──────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const documentRoutes  = require('./routes/documentRoutes');
const ragRoutes       = require('./routes/ragRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const webhookRoutes   = require('./routes/webhookRoutes');

const app  = express();
// ── Service Status ──
app.get('/api/status', (req, res) => {
    res.send(`
        <div style="font-family:sans-serif; text-align:center; padding-top:100px;">
            <h1 style="color:#00a2ff;">✅ AI-Mall™ Backend is LIVE</h1>
            <p style="color:#666;">Core Engine: <b>Gemini 2.5 Flash</b></p>
            <p style="color:#999;">Status: Operational | Environment: Cloud Run</p>
        </div>
    `);
});

const PORT = process.env.PORT || 8080;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── MongoDB Connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.warn('⚠️ MONGO_URI missing in environment variables. Database features will be disabled.');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Error:', err));
}

// ── AI Init ──────────────────────────────────────────────────────────────────
console.log(`🧠 AI model: ${modelName}`);

// ── Legacy Models (existing schema — kept for backward compat) ───────────────
const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true }, company: String,
    email: { type: String, required: true }, interest: String,
    message: { type: String, required: true }, status: { type: String, default: 'new' },
    created_at: { type: Date, default: Date.now }
});
const PartnerSchema = new mongoose.Schema({
    name: { type: String, required: true }, company: { type: String, required: true },
    email: { type: String, required: true }, phone: String, partner_type: String,
    website: String, message: String, status: { type: String, default: 'pending' },
    created_at: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);
const Partner = mongoose.model('Partner', PartnerSchema);

// ── Unified Admin Auth (JWT Bearer Token or Internal ADMIN_KEY from env) ──────
const jwt = require('jsonwebtoken');
function adminAuth(req, res, next) {
    // 1. Verify standard JWT Bearer token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) return res.status(500).json({ error: 'Auth secret not configured' });
            const decoded = jwt.verify(token, secret);
            if (decoded && (decoded.role === 'admin' || decoded.role === 'viewer')) {
                req.user = decoded;
                return next();
            }
        } catch (e) {
            return res.status(401).json({ error: 'Invalid or expired session token' });
        }
    }

    // 2. Machine-to-machine internal admin key (strictly checked against env)
    const ADMIN_KEY = process.env.ADMIN_KEY;
    const key = req.headers['x-admin-key'] || req.query.key;
    if (ADMIN_KEY && key && key === ADMIN_KEY) {
        req.user = { role: 'admin', username: 'internal_admin' };
        return next();
    }

    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
}

// ════════════════════════════════════════════════════════════════════════════
// NEW RAG SYSTEM ROUTES
// ════════════════════════════════════════════════════════════════════════════
app.use('/api/auth',       authRoutes);
app.use('/api/documents',  documentRoutes);
app.use('/api/rag',        ragRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/webhooks',   webhookRoutes);

// ════════════════════════════════════════════════════════════════════════════
// LEGACY PUBLIC API ROUTES (kept intact)
// ════════════════════════════════════════════════════════════════════════════

// POST /api/chat — legacy AISA chatbot (Converted to Streaming SSE)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!aiInstance) return res.status(500).json({ error: 'AI not initialized' });

        const cleanHistory = (history || []).map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts ? (h.parts[0].text || "") : (h.text || "") }]
        }));

        // SSE headers for Cloud Run compatibility
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const result = await aiInstance.models.generateContentStream({
            model: modelName,
            contents: [...cleanHistory, { role: 'user', parts: [{ text: message }] }]
        });

        let fullText = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`);
        res.end();
    } catch (err) {
        console.error('Legacy AI Error:', err.message);
        res.status(500).write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        res.end();
    }
});

// ── JSON Helper ──
const DATA_PATH = path.join(__dirname, 'data.json');
const readData = () => {
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); }
    catch (e) { return { contacts: [], partners: [] }; }
};
const writeData = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    try {
        const data = readData();
        const entry = { ...req.body, id: Date.now(), status: 'new', created_at: new Date().toISOString() };
        data.contacts.push(entry);
        writeData(data);
        res.json({ success: true, id: entry.id, message: 'Message received! We will contact you within 24 hours.' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/partner
app.post('/api/partner', async (req, res) => {
    try {
        const data = readData();
        const entry = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
        data.partners.push(entry);
        writeData(data);
        res.json({ success: true, id: entry.id, message: 'Application submitted!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Legacy Admin Routes ───────────────────────────────────────────────────────
app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const data = readData();
        const stats = {
            totalContacts: data.contacts.length,
            newContacts: data.contacts.filter(c => c.status === 'new').length,
            totalPartners: data.partners.length,
            pendingPartners: data.partners.filter(p => p.status === 'pending').length,
            todayContacts: data.contacts.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length,
            todayPartners: data.partners.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length
        };
        res.json({ success: true, stats });
    } catch (err) { 
        console.error('❌ Stats Error:', err.message);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

app.get('/api/admin/contacts', adminAuth, async (req, res) => {
    try {
        const data = readData();
        res.json({ success: true, data: data.contacts, total: data.contacts.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/partners', adminAuth, async (req, res) => {
    try {
        const data = readData();
        res.json({ success: true, data: data.partners, total: data.partners.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/contact/:id/status', adminAuth, async (req, res) => {
    try { 
        const data = readData();
        const item = data.contacts.find(c => String(c.id) === String(req.params.id));
        if (item) item.status = req.body.status;
        writeData(data);
        res.json({ success: !!item }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/partner/:id/status', adminAuth, async (req, res) => {
    try { 
        const data = readData();
        const item = data.partners.find(p => String(p.id) === String(req.params.id));
        if (item) item.status = req.body.status;
        writeData(data);
        res.json({ success: !!item }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/contact/:id', adminAuth, async (req, res) => {
    try { 
        const data = readData();
        const initialLen = data.contacts.length;
        data.contacts = data.contacts.filter(c => String(c.id) !== String(req.params.id));
        writeData(data);
        res.json({ success: data.contacts.length < initialLen }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/partner/:id', adminAuth, async (req, res) => {
    try { 
        const data = readData();
        const initialLen = data.partners.length;
        data.partners = data.partners.filter(p => String(p.id) !== String(req.params.id));
        writeData(data);
        res.json({ success: data.partners.length < initialLen }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Static Frontend ───────────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../ai-mall_frontend/dist');
const devFrontendPath = path.join(__dirname, '../ai-mall_frontend');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else if (fs.existsSync(devFrontendPath)) {
    app.use(express.static(devFrontendPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(devFrontendPath, 'index.html'));
    });
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`\n🚀 AI-Mall™ RAG Backend running → http://${HOST}:${PORT}`);
    console.log('📚 RAG System: /api/rag/chat/stream  (SSE streaming)');
    console.log('📁 Knowledge Base: /api/documents');
    console.log('📊 Analytics: /api/analytics');
    console.log('🔐 Auth: /api/auth/login\n');
});
