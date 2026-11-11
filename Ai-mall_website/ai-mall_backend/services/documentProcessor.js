/**
 * Document Processor Service
 * Extracts text from PDF, DOCX, TXT files
 * Chunks text into overlapping segments
 */

const fs   = require('fs');
const path = require('path');

// ── Chunk Configuration ──
const CHUNK_SIZE    = 500;   // tokens (~400 words)
const CHUNK_OVERLAP = 80;    // overlap tokens

/**
 * Extract raw text from uploaded file
 */
async function extractText(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();

    // ── TXT files ──
    if (mimeType === 'text/plain' || ext === '.txt') {
        return fs.readFileSync(filePath, 'utf-8');
    }

    // ── PDF files ──
    if (mimeType === 'application/pdf' || ext === '.pdf') {
        try {
            const pdfParse = require('pdf-parse');
            const buffer   = fs.readFileSync(filePath);
            const data     = await pdfParse(buffer);
            return data.text;
        } catch (e) {
            throw new Error(`PDF parsing failed: ${e.message}`);
        }
    }

    // ── DOCX/DOC files ──
    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword' ||
        ext === '.docx' || ext === '.doc'
    ) {
        try {
            const mammoth = require('mammoth');
            const result  = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (e) {
            throw new Error(`DOCX parsing failed: ${e.message}`);
        }
    }

    throw new Error(`Unsupported file type: ${mimeType || ext}`);
}

/**
 * Split text into overlapping chunks
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    const words  = text.split(/\s+/).filter(w => w.length > 0);
    const chunks = [];

    for (let i = 0; ; i += (chunkSize - overlap)) {
        const chunkWords = words.slice(i, Math.min(i + chunkSize, words.length));
        if (chunkWords.length === 0) break;

        chunks.push({
            index:      chunks.length,
            content:    chunkWords.join(' '),
            tokenCount: chunkWords.length,
            embedding:  []
        });

        if (i + chunkSize >= words.length) break;
    }
    return chunks;
}

/**
 * Detect language of text (simple heuristic: Hindi unicode range)
 * Returns 'hi', 'en', or 'mixed'
 */
function detectLanguage(text) {
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars === 0) return 'en';
    const ratio = hindiChars / totalChars;
    if (ratio > 0.5)  return 'hi';
    if (ratio > 0.1)  return 'mixed';
    return 'en';
}

module.exports = { extractText, chunkText, detectLanguage };
