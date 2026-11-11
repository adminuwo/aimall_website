/**
 * Embedding Service
 * Uses text-embedding-004 model via new Google Gen AI SDK
 */

const { aiInstance } = require('../config/vertex');

const EMBEDDING_MODEL = 'text-embedding-004';
const SIMILARITY_THRESHOLD = parseFloat(process.env.RAG_THRESHOLD || '0.62');

/**
 * Generate embedding vector for a single text string
 */
async function generateEmbedding(text) {
    if (!aiInstance) {
        console.error('❌ AI Instance not initialized for embeddings.');
        return new Array(768).fill(0);
    }

    const cleanText = text.slice(0, 30000).replace(/\r?\n|\r/g, " ");

    try {
        console.log(`📡 Generating embedding for: "${text.slice(0, 30)}..."`);
        const response = await aiInstance.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: [{ parts: [{ text: cleanText }] }],
        });

        // 🟢 Handle standard GenAI/Vertex response structure
        if (response?.embedding?.values) {
            return response.embedding.values;
        }

        // 🟠 Handle batch/array response
        if (response?.embeddings && response.embeddings[0]?.values) {
            return response.embeddings[0].values;
        }

        // 🔴 Catch-all for other SDK variants
        if (response?.values) return response.values;

        console.error("❌ Invalid embedding response format:", JSON.stringify(response).slice(0, 200));
        return new Array(768).fill(0);
    } catch (err) {
        console.error('❌ Vertex Embedding failed:', err.message);
        return new Array(768).fill(0);
    }
}

/**
 * Generate embeddings for multiple texts (batched)
 * @returns {number[][]}
 */
async function generateEmbeddingsBatch(texts) {
    // Process in batches of 5 to respect rate limits
    const BATCH = 5;
    const results = [];
    for (let i = 0; i < texts.length; i += BATCH) {
        const batch = texts.slice(i, i + BATCH);
        const batchResults = await Promise.all(batch.map(t => generateEmbedding(t)));
        results.push(...batchResults);
        if (i + BATCH < texts.length) {
            await new Promise(r => setTimeout(r, 500)); // rate limit pause
        }
    }
    return results;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
    generateEmbedding,
    generateEmbeddingsBatch,
    cosineSimilarity,
    SIMILARITY_THRESHOLD
};
