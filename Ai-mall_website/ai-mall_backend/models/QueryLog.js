const mongoose = require('mongoose');

const QueryLogSchema = new mongoose.Schema({
    sessionId:      { type: String, required: true },
    userQuery:      { type: String, required: true },
    language:       { type: String, default: 'en' },
    ragUsed:        { type: Boolean, default: false },
    docSourceIds:   { type: [String], default: [] },      // which docs contributed
    similarityScore:{ type: Number, default: 0 },
    fallbackUsed:   { type: Boolean, default: false },   // Vertex fallback?
    responseText:   { type: String, default: '' },
    responseTimeMs: { type: Number, default: 0 },
    success:        { type: Boolean, default: true },
    errorMessage:   { type: String, default: '' },
    userIp:         { type: String, default: '' },
    webhookSent:    { type: Boolean, default: false },
    created_at:     { type: Date, default: Date.now }
});

QueryLogSchema.index({ created_at: -1 });
QueryLogSchema.index({ sessionId: 1 });
QueryLogSchema.index({ ragUsed: 1, fallbackUsed: 1 });

module.exports = mongoose.model('QueryLog', QueryLogSchema);
