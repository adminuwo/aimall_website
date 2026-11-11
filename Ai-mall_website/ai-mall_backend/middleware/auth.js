const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY  = process.env.ADMIN_KEY;

// ── JWT Token Verifier ──
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const headerKey  = req.headers['x-admin-key'];

    // Internal machine-to-machine key auth (strictly from env variable)
    if (ADMIN_KEY && headerKey && headerKey === ADMIN_KEY) {
        req.user = { role: 'admin', username: 'internal_admin', legacy: true };
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    if (!JWT_SECRET) {
        return res.status(500).json({ success: false, error: 'Server authentication configuration missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

// ── Admin-only gate ──
function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated' });
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
}

// ── Viewer or Admin gate ──
function requireViewer(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated' });
    if (!['admin', 'viewer'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
}

module.exports = { verifyToken, requireAdmin, requireViewer, JWT_SECRET };
