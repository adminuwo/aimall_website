const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const { getFullSystemInstruction } = require('../services/configService.js');

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || 'asia-south1';
const modelName = process.env.AI_MODEL_NAME || "gemini-2.5-flash";

let aiInstance = null;

if (apiKey) {
    console.log(`✅ Gemini AI initializing with API Key`);
    aiInstance = new GoogleGenAI({ apiKey: apiKey });
} else if (projectId) {
    console.log(`✅ Vertex AI initializing with project: ${projectId} via new @google/genai SDK`);
    aiInstance = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: location
    });
} else {
    console.error("❌ Error: Neither GOOGLE_API_KEY nor GCP_PROJECT_ID found in environment variables.");
}

const getDynamicSystemInstruction = () => {
    return getFullSystemInstruction();
};

module.exports = {
    modelName,
    aiInstance,
    getDynamicSystemInstruction
};