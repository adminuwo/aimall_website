const express = require('express');
const { verifyToken, requireViewer } = require('../middleware/auth');
const QueryLog = require('../models/QueryLog');
const Document = require('../models/Document');

const router = express.Router();

// ── GET /api/analytics/overview ──────────────────────────────────────────────
router.get('/overview', verifyToken, requireViewer, async (req, res) => {
    try {
        const totalQueries = await QueryLog.countDocuments();
        const ragQueries = await QueryLog.countDocuments({ ragUsed: true });
        const fallbackQueries = await QueryLog.countDocuments({ fallbackUsed: true });
        const failedQueries = await QueryLog.countDocuments({ success: false });

        const totalDocs = await Document.countDocuments();
        const processedDocs = await Document.countDocuments({ status: 'processed' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayQueries = await QueryLog.countDocuments({ created_at: { $gte: today } });

        const avgResult = await QueryLog.aggregate([
            { $match: { success: true } },
            { $group: { _id: null, avgTime: { $avg: '$responseTimeMs' } } }
        ]);
        const avgResponseMs = avgResult.length ? avgResult[0].avgTime : 0;

        res.json({
            success: true,
            stats: {
                totalQueries, ragQueries, fallbackQueries, failedQueries,
                totalDocs, processedDocs, todayQueries,
                avgResponseMs: Math.round(avgResponseMs),
                ragSuccessRate: totalQueries ? ((ragQueries / totalQueries) * 100).toFixed(1) : "0.0"
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/analytics/top-queries ───────────────────────────────────────────
router.get('/top-queries', verifyToken, requireViewer, async (req, res) => {
    try {
        const topQueries = await QueryLog.aggregate([
            { $group: {
                _id: { $toLower: '$userQuery' },
                count: { $sum: 1 },
                ragHits: { $sum: { $cond: ['$ragUsed', 1, 0] } },
                lastAsked: { $max: '$created_at' }
            }},
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);
        res.json({ success: true, topQueries });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/analytics/failed-queries ────────────────────────────────────────
router.get('/failed-queries', verifyToken, requireViewer, async (req, res) => {
    try {
        const logs = await QueryLog.find({ success: false })
            .sort({ created_at: -1 })
            .limit(50)
            .select('userQuery errorMessage created_at sessionId');
        res.json({ success: true, failedQueries: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/analytics/logs ───────────────────────────────────────────────────
router.get('/logs', verifyToken, requireViewer, async (req, res) => {
    try {
        const page  = parseInt(req.query.page  || 1);
        const limit = parseInt(req.query.limit || 20);
        const skip  = (page - 1) * limit;

        const query = {};
        if (req.query.ragOnly === 'true') query.ragUsed = true;
        if (req.query.failedOnly === 'true') query.success = false;
        if (req.query.sessionId) query.sessionId = req.query.sessionId;

        const total = await QueryLog.countDocuments(query);
        const logs = await QueryLog.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        res.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/analytics/daily ──────────────────────────────────────────────────
router.get('/daily', verifyToken, requireViewer, async (req, res) => {
    try {
        const days = parseInt(req.query.days || 7);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const daily = await QueryLog.aggregate([
            { $match: { created_at: { $gte: fromDate } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                total: { $sum: 1 },
                ragCount: { $sum: { $cond: ['$ragUsed', 1, 0] } },
                fallbackCount: { $sum: { $cond: ['$fallbackUsed', 1, 0] } },
                failCount: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, daily });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

module.exports = router;
