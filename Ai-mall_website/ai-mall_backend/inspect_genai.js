
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const projectId = process.env.GCP_PROJECT_ID;

const aiInstance = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: 'asia-south1'
});

console.log('--- AI Instance ---');
console.log(Object.keys(aiInstance));

console.log('--- AI Instance.models ---');
console.log(Object.keys(aiInstance.models));

console.log('--- AI Instance.chats ---');
console.log(Object.keys(aiInstance.chats));
