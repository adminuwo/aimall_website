/**
 * RAG Chat Routes — Streaming SSE endpoint + non-streaming fallback (Using Local Data)
 */
const express    = require('express');
const { ragQueryStream } = require('../services/ragService');
const { fireWebhook }    = require('../services/webhookService');
const router = express.Router();

const QueryLog = require('../models/QueryLog');

async function saveQueryLog(logData) {
    try {
        await QueryLog.create(logData);
    } catch (e) {
        console.error('❌ Failed to save query log to MongoDB', e.message);
    }
}

// ── POST /api/rag/chat/stream  (SSE streaming) ───────────────────────────────
router.post('/chat/stream', async (req, res) => {
    console.log('--- Incoming Chat Request ---');
    const { message, history = [], sessionId = 'anon' } = req.body;
    console.log(`User: ${message} (Session: ${sessionId})`);
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Bypass Cloud Run buffering
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Ping to prevent 30s timeout
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);

    await ragQueryStream(
        message,
        history,
        // onChunk
        (text) => send({ type: 'chunk', text }),
        // onDone
        async (meta) => {
            clearInterval(ping);
            send({ type: 'done', ...meta });
            res.end();

            // Log query
            saveQueryLog({
                sessionId,
                userQuery:       message,
                language:        meta.language,
                ragUsed:         meta.ragUsed,
                fallbackUsed:    meta.fallbackUsed,
                similarityScore: meta.similarityScore,
                docSourceIds:    meta.docSourceIds,
                responseText:    meta.fullText.slice(0, 1000),
                responseTimeMs:  meta.responseTimeMs,
                success:         true,
                userIp:          req.ip
            });

            await fireWebhook('query', { sessionId, query: message, ragUsed: meta.ragUsed });
        },
        // onError
        async (err) => {
            clearInterval(ping);
            console.error('❌ RAG stream error:', err.message);
            send({ type: 'error', message: 'Something went wrong. Please try again.' });
            res.end();

            saveQueryLog({
                sessionId, userQuery: message, success: false,
                errorMessage: err.message, userIp: req.ip
            });
        }
    );
});

// ── POST /api/rag/chat  (non-streaming, backward compat) ─────────────────────
router.post('/chat', async (req, res) => {
    const { message, history = [], sessionId = 'anon' } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });

    let fullResponse = '', meta = {};

    try {
        await new Promise((resolve, reject) => {
            ragQueryStream(
                message, history,
                (chunk) => { fullResponse += chunk; },
                (m)     => { meta = m; resolve(); },
                (err)   => reject(err)
            );
        });

        saveQueryLog({
            sessionId,
            userQuery:       message,
            language:        meta.language,
            ragUsed:         meta.ragUsed,
            fallbackUsed:    meta.fallbackUsed,
            similarityScore: meta.similarityScore,
            docSourceIds:    meta.docSourceIds,
            responseText:    fullResponse.slice(0, 1000),
            responseTimeMs:  meta.responseTimeMs,
            success:         true,
            userIp:          req.ip
        });

        res.json({ success: true, answer: fullResponse, ...meta });
    } catch (err) {
        res.status(500).json({ success: false, error: 'AI processing failed', details: err.message });
    }
});

module.exports = router;
