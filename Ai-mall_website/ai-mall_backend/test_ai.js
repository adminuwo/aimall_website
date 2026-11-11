const { aiInstance, modelName } = require('./config/vertex');

async function test() {
    console.log("Testing AI Instance...");
    if (!aiInstance) {
        console.error("AI Instance is null");
        return;
    }
    console.log("AI Instance keys:", Object.keys(aiInstance));
    if (aiInstance.models) {
        console.log("aiInstance.models keys:", Object.keys(aiInstance.models));
    } else {
        console.log("aiInstance.models is UNDEFINED");
    }

    try {
        console.log("Testing generateContentStream...");
        const result = await aiInstance.models.generateContentStream({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
        });
        console.log("Success calling generateContentStream");
    } catch (e) {
        console.error("Failed calling generateContentStream:", e.message);
    }
}

test();
