const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
    content:    { type: String, required: true },
    index:      { type: Number, required: true },
    embedding:  { type: [Number], default: [] },   // stored locally if Pinecone not configured
    tokenCount: { type: Number, default: 0 }
});

const DocumentSchema = new mongoose.Schema({
    filename:        { type: String, required: true },
    originalName:    { type: String, required: true },
    mimeType:        { type: String, required: true },
    fileSize:        { type: Number, required: true },
    path:            { type: String, default: '' },       // Local absolute path for processing
    storageUrl:      { type: String, default: '' },       // GCS URL or local path
    storageType:     { type: String, enum: ['local', 'gcs'], default: 'local' },
    status:          { type: String, enum: ['pending', 'processing', 'processed', 'error'], default: 'pending' },
    errorMessage:    { type: String, default: '' },
    extractedText:   { type: String, default: '' },
    chunks:          { type: [ChunkSchema], default: [] },
    chunkCount:      { type: Number, default: 0 },
    language:        { type: String, default: 'auto' },   // 'en', 'hi', 'auto'
    pineconeIndexed: { type: Boolean, default: false },
    uploadedBy:      { type: String, default: 'admin' },
    tags:            { type: [String], default: [] },
    created_at:      { type: Date, default: Date.now },
    processed_at:    { type: Date }
});

DocumentSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('Document', DocumentSchema);
