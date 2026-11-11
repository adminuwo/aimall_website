/**
 * Brand Enforcer — Utility to ensure trademark usage in all bot responses
 * This is a fail-safe to guarantee compliance even if the LLM skips a TM.
 */

const ENFORCEMENT_RULES = [
    { pattern: /\bai-mall\b(?!™)/gi, replacement: 'AI-Mall™' },
    { pattern: /\bai mall\b(?!™)/gi, replacement: 'AI-Mall™' },
    { pattern: /\ba-series\b(?!™)/gi, replacement: 'A-Series™' },
    { pattern: /\baisa\b(?!™)/gi, replacement: 'AISA™' }
];

/**
 * Clean and enforce brand trademarks on a string
 */
function enforceBranding(text) {
    if (!text) return text;
    let enforced = text;
    ENFORCEMENT_RULES.forEach(rule => {
        enforced = enforced.replace(rule.pattern, rule.replacement);
    });
    return enforced;
}

module.exports = { enforceBranding };
