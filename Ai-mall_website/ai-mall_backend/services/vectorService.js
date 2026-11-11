/**
 * Vector Service
 * Abstraction over vector storage.
 * Priority: Pinecone (if configured) → MongoDB in-document cosine search
 */

const { cosineSimilarity, SIMILARITY_THRESHOLD } = require('./embeddingService');
const Document = require('../models/Document');

const TOP_K = parseInt(process.env.RAG_TOP_K || '10');

// ── Pinecone Client (optional) ──────────────────────────────────────────────
let pineconeIndex = null;
async function getPineconeIndex() {
    if (pineconeIndex) return pineconeIndex;
    const PINECONE_KEY  = process.env.PINECONE_API_KEY;
    const PINECONE_IDX  = process.env.PINECONE_INDEX || 'aimall-rag';
    if (!PINECONE_KEY) return null;
    try {
        const { Pinecone } = require('@pinecone-database/pinecone');
        const pc = new Pinecone({ apiKey: PINECONE_KEY });
        pineconeIndex = pc.index(PINECONE_IDX);
        console.log('✅ Pinecone connected:', PINECONE_IDX);
        return pineconeIndex;
    } catch (e) {
        console.warn('⚠️  Pinecone unavailable, using MongoDB fallback:', e.message);
        return null;
    }
}

// ── Upsert vectors ────────────────────────────────────────────────────────────
async function upsertVectors(documentId, chunks) {
    const idx = await getPineconeIndex();
    if (idx) {
        const vectors = chunks.map(c => ({
            id:       `${documentId}_${c.index}`,
            values:   c.embedding,
            metadata: { documentId: documentId.toString(), chunkIndex: c.index, content: c.content.slice(0, 500) }
        }));
        // Pinecone batch upsert (100 at a time)
        for (let i = 0; i < vectors.length; i += 100) {
            await idx.upsert(vectors.slice(i, i + 100));
        }
        return 'pinecone';
    }
    // MongoDB: embeddings are already stored on the Document model chunks
    return 'mongodb';
}

// ── Delete vectors for a document ────────────────────────────────────────────
async function deleteVectors(documentId, chunkCount) {
    const idx = await getPineconeIndex();
    if (idx) {
        const ids = Array.from({ length: chunkCount }, (_, i) => `${documentId}_${i}`);
        try { await idx.deleteMany(ids); } catch (e) { /* ignore */ }
    }
    // MongoDB: deletion is handled by deleting the Document itself
}

// ── Using local JSON for now for data ──
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../knowledge.json');

async function querySimilar(queryEmbedding, topK = TOP_K) {
    const idx = await getPineconeIndex();

    if (idx) {
        // ── Pinecone path ──
        const result = await idx.query({
            vector:          queryEmbedding,
            topK,
            includeMetadata: true
        });
        return result.matches.map(m => ({
            content:        m.metadata.content,
            documentId:     m.metadata.documentId,
            chunkIndex:     m.metadata.chunkIndex,
            similarityScore: m.score
        }));
    }

    // ── MongoDB fallback ──
    try {
        const docs = await Document.find({ status: 'processed' });
        const scored = [];

        for (const doc of docs) {
            if (!doc.chunks || !Array.isArray(doc.chunks)) continue;
            for (const chunk of doc.chunks) {
                if (!chunk.embedding || chunk.embedding.length === 0) continue;
                const score = cosineSimilarity(queryEmbedding, chunk.embedding);
                scored.push({
                    content:         chunk.content,
                    documentId:      doc._id,
                    documentName:    doc.originalName,
                    chunkIndex:      chunk.index,
                    similarityScore: score
                });
            }
        }
        return scored
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, topK);
    } catch (err) {
        console.error('❌ MongoDB Vector Search error:', err.message);
        return [];
    }
}

// ── Re-rank results (cross-encoder style keyword boost) ──────────────────────
function reRankResults(results, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    return results.map(r => {
        const content = r.content.toLowerCase();
        const kwBoost = queryWords.filter(w => content.includes(w)).length / queryWords.length;
        return { ...r, rerankScore: r.similarityScore * 0.8 + kwBoost * 0.2 };
    }).sort((a, b) => b.rerankScore - a.rerankScore);
}

module.exports = { upsertVectors, deleteVectors, querySimilar, reRankResults, SIMILARITY_THRESHOLD };
