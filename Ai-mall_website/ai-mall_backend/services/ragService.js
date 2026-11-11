/**
 * RAG Service — Core Pipeline
 * Query → Embed → Search → (Re-rank) → LLM → Stream response
 */

const { generateEmbedding } = require('./embeddingService');
const { querySimilar, reRankResults, SIMILARITY_THRESHOLD } = require('./vectorService');
const { aiInstance, modelName, getDynamicSystemInstruction } = require('../config/vertex');
const { enforceBranding } = require('../utils/brandEnforcer');

const UNIVERSAL_LANG_INSTRUCTION = "Always respond in the same language as the user's question (e.g., if asked in Hindi, respond in Hindi; if in Spanish, respond in Spanish, etc.).";

/**
 * Build RAG prompt from context chunks
 */
function buildRAGPrompt(query, chunks) {
    const context = chunks.map((c, i) => `[Source ${i + 1}]: ${c.content}`).join('\n\n');

    return `You are AI-Mall™ Bot, a highly intelligent Smart Assistant. 
Always use AI-Mall™, A-Series™, and AISA™ with the ™ symbol.
${UNIVERSAL_LANG_INSTRUCTION}

You have been provided with exclusive context from the AI-Mall™ internal knowledge base. 
Use this context as your primary source of truth. Try to answer the user's question as accurately as possible. 

=== KNOWLEDGE BASE CONTEXT ===
${context}
==============================

User's Question: ${query}

Guidelines:
- If document details exist, prioritize them above general knowledge.
- Be professional, conversational, and direct.
- Maintain the AI-Mall™ brand voice throughout.`;
}

/**
 * Build fallback prompt (no RAG context)
 */
function buildFallbackPrompt(query, hintChunks = []) {
    let hintText = "";
    if (hintChunks && hintChunks.length > 0) {
        hintText = `\n\n=== RELEVANT HINTS FROM KNOWLEDGE BASE ===\n` + 
                   hintChunks.map((c, i) => `Hint ${i+1}: ${c.content}`).join('\n') +
                   `=========================================\n\nUse the hints above to guide your answer if they are relevant.`;
    }
    return `You are AI-Mall™ Bot, a highly intelligent Smart Assistant. Always use AI-Mall™, A-Series™, and AISA™ with the ™ symbol. ${UNIVERSAL_LANG_INSTRUCTION}${hintText}
User's Question: ${query}`;
}

/**
 * Full RAG pipeline — streaming version (SSE compatible)
 */
async function ragQueryStream(query, history = [], onChunk, onDone, onError) {
    const startTime = Date.now();
    console.log(`🤖 Processing RAG Query: "${query}" (Multi-language mode)`);

    try {
        // Step 1: Embed query
        let queryEmbedding;
        try {
            queryEmbedding = await generateEmbedding(query);
            console.log('✅ Query embedding generated');
        } catch (e) {
            console.warn('⚠️ Embedding failed, using fallback LLM:', e.message);
            return await fallbackStream(query, history, onChunk, onDone, onError, startTime, false, 0);
        }

        // --- VECTOR SEARCH ---
        const rawResults = await querySimilar(queryEmbedding);
        console.log(`🔍 Vector Search found ${rawResults.length} raw results.`);

        const results = reRankResults(rawResults, query);
        const topScore = results.length > 0 ? results[0].similarityScore : 0;
        const ragUsed = topScore >= SIMILARITY_THRESHOLD;

        console.log(`📊 Top Score: ${(topScore * 100).toFixed(1)}% | Threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(1)}% | RAG Hit: ${ragUsed}`);
        
        if (results.length > 0) {
            console.log(`📝 Best Match Preview: "${results[0].content.slice(0, 100)}..."`);
        }

        // If RAG score isn't met, let's pass to fallback with 'best-effort' context
        if (!ragUsed) {
            console.log(`⚠️ Low RAG score (${topScore.toFixed(3)}), redirecting to fallback with hints.`);
            const bestEffortHints = results.slice(0, 4); // Still give some context
            return await fallbackStream(query, history, onChunk, onDone, onError, startTime, false, topScore, bestEffortHints);
        }

        // --- RAG SUCCEEDED, CONSTRUCT PROMPT ---
        const topChunks = results.slice(0, 6);
        const prompt = buildRAGPrompt(query, topChunks);

        const cleanHistory = (history || []).map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts[0].text || "" }]
        }));

        // Step 4: Stream LLM response
        console.log(`🧠 Calling Vertex AI model (${modelName}) in RAG mode via @google/genai...`);

        const resultStream = await aiInstance.models.generateContentStream({
            model: modelName,
            contents: [...cleanHistory, { role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: getDynamicSystemInstruction() }
        });

        let fullText = '';
        for await (const chunk of resultStream) {
            const text = chunk.text || '';
            if (text) {
                const cleanedText = enforceBranding(text);
                fullText += cleanedText;
                onChunk(cleanedText);
            }
        }

        const elapsed = Date.now() - startTime;
        onDone({
            ragUsed: true,
            fallbackUsed: false,
            similarityScore: topScore,
            responseTimeMs: elapsed,
            docSourceIds: results.slice(0, 6).map(r => r.documentId),
            fullText
        });

    } catch (err) {
        console.error('❌ RAG Pipeline Error:', err.message);
        // Fallback gracefully on catastrophic pipeline errs
        await fallbackStream(query, history, onChunk, onDone, onError, startTime, false, 0, []);
    }
}

/**
 * Fallback: plain Vertex/Gemini LLM with streaming 
 */
async function fallbackStream(query, history, onChunk, onDone, onError, startTime, ragUsed, topScore, hintChunks = []) {
    try {
        const prompt = buildFallbackPrompt(query, hintChunks);

        const cleanHistory = (history || []).map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts[0].text || "" }]
        }));

        console.log(`🧠 Calling Vertex AI model (${modelName}) via fallback @google/genai API...`);

        const resultStream = await aiInstance.models.generateContentStream({
            model: modelName,
            contents: [...cleanHistory, { role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: getDynamicSystemInstruction() }
        });

        let fullText = '';
        for await (const chunk of resultStream) {
            const text = chunk.text || '';
            if (text) { 
                const cleanedText = enforceBranding(text);
                fullText += cleanedText; 
                onChunk(cleanedText); 
            }
        }

        onDone({
            ragUsed: ragUsed || false,
            fallbackUsed: !ragUsed,
            similarityScore: topScore || 0,
            responseTimeMs: Date.now() - startTime,
            docSourceIds: (hintChunks || []).map(r => r.documentId),
            fullText
        });
    } catch (err) {
        console.error('❌ Fallback Stream Error:', err.message);
        onError(err);
    }
}

module.exports = { ragQueryStream };
