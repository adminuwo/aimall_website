const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AdminUser = require('./models/AdminUser');
const Document = require('./models/Document');
const QueryLog = require('./models/QueryLog');
const WebhookConfig = require('./models/WebhookConfig');

const MONGO_URI = process.env.MONGO_URI;
const DATA_PATH = path.join(__dirname, 'data.json');
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge.json');

async function migrate() {
    if (!MONGO_URI) { console.error('❌ MONGO_URI is missing in .env'); return; }
    
    console.log('🚀 Starting Data Migration to MongoDB...');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Migrate Users, Logs, Webhooks from data.json
        if (fs.existsSync(DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
            
            if (data.users && data.users.length) {
                console.log(`👤 Migrating ${data.users.length} users...`);
                for (const u of data.users) {
                    await AdminUser.findOneAndUpdate({ username: u.username }, u, { upsert: true });
                }
            }

            if (data.queryLogs && data.queryLogs.length) {
                console.log(`📊 Migrating ${data.queryLogs.length} query logs...`);
                // Clear and re-load logs to avoid confusing duplicates during development
                await QueryLog.deleteMany({});
                await QueryLog.insertMany(data.queryLogs);
            }

            if (data.webhooks && data.webhooks.length) {
                console.log(`🔗 Migrating ${data.webhooks.length} webhooks...`);
                for (const w of data.webhooks) {
                    await WebhookConfig.findOneAndUpdate({ url: w.url }, w, { upsert: true });
                }
            }
        }

        // 2. Migrate Documents from knowledge.json
        if (fs.existsSync(KNOWLEDGE_PATH)) {
            const kData = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
            if (kData.documents && kData.documents.length) {
                console.log(`📄 Migrating ${kData.documents.length} documents from knowledge.json...`);
                for (const d of kData.documents) {
                    const docToSave = {
                        originalName: d.name || d.originalName,
                        path: d.path || '',
                        mimeType: d.mimeType || 'application/pdf',
                        size: d.size || 0,
                        url: d.url || '',
                        storageType: d.storageType || 'local',
                        status: d.status || 'processed',
                        uploadedBy: d.uploadedBy || 'admin',
                        chunks: d.chunks || [],
                        chunkCount: (d.chunks || []).length,
                        createdAt: d.createdAt || new Date()
                    };
                    await Document.findOneAndUpdate({ originalName: docToSave.originalName }, docToSave, { upsert: true });
                }
            }
        }

        console.log('\n✨ MIGRATION COMPLETE! ✨');
        console.log('All users, logs, and knowledge base documents are now in MongoDB.');
    } catch (err) {
        console.error('❌ Migration Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
    
