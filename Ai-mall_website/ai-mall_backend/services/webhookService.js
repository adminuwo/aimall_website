/**
 * Webhook Service
 * Fire-and-forget POST to registered webhook URLs (Using Local Data)
 */

const { readData, writeData } = require('../utils/dataStore');

async function fireWebhook(eventType, payload) {
    try {
        const data = readData();
        const hooks = (data.webhooks || []).filter(h => h.isActive && h.events === eventType);
        
        for (let i = 0; i < hooks.length; i++) {
            const hook = hooks[i];
            try {
                const body = JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), ...payload });
                const headers = { 'Content-Type': 'application/json' };
                if (hook.secret) headers['X-Webhook-Secret'] = hook.secret;

                // Use built-in fetch (Node 18+)
                if (typeof fetch !== 'undefined') {
                    fetch(hook.url, { method: 'POST', headers, body }).catch(() => {});
                }

                hook.lastFired = new Date().toISOString();
            } catch (e) { /* individual hook error, continue */ }
        }

        if (hooks.length > 0) {
            writeData(data); // persist lastFired
        }
    } catch (e) { /* non-blocking */ }
}

module.exports = { fireWebhook };
