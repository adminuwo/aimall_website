const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const WebhookConfig = require('../models/WebhookConfig');

const router = express.Router();

router.get('/',    verifyToken, requireAdmin, async (req, res) => {
    try {
        const hooks = await WebhookConfig.find();
        res.json({ success: true, webhooks: hooks });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/',   verifyToken, requireAdmin, async (req, res) => {
    try {
        const hook = await WebhookConfig.create({ ...req.body, created_at: new Date() });
        res.json({ success: true, webhook: hook });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const updated = await WebhookConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: !!updated, webhook: updated });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await WebhookConfig.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
