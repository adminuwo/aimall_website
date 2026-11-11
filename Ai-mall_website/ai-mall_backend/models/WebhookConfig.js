const mongoose = require('mongoose');

const WebhookConfigSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    url:        { type: String, required: true },
    events:     { type: [String], default: ['query', 'upload', 'error'] },
    secret:     { type: String, default: '' },
    isActive:   { type: Boolean, default: true },
    lastFired:  { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WebhookConfig', WebhookConfigSchema);
