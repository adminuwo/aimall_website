/**
 * Auth Routes — JWT login, register, profile
 */
const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');
const AdminUser = require('../models/AdminUser');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });

        // Seed initial admin from ENV variables if DB is completely empty (non-blocking)
        try {
            if (mongoose.connection.readyState === 1) {
                const count = await AdminUser.countDocuments();
                if (count === 0 && process.env.ADMIN_DEFAULT_PASSWORD) {
                    const defaultUser  = process.env.ADMIN_DEFAULT_USER || 'admin';
                    const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@aimall.in';
                    const defaultPass  = process.env.ADMIN_DEFAULT_PASSWORD;
                    const hashed = await bcrypt.hash(defaultPass, 10);
                    await AdminUser.create({ 
                        username: defaultUser, 
                        email: defaultEmail, 
                        password: hashed, 
                        role: 'admin', 
                        isActive: true 
                    });
                    console.log(`🔐 Initial admin account initialized for: ${defaultUser}`);
                }
            }
        } catch (seedErr) {
            // MongoDB not ready or seeding skipped
        }

        const secret = process.env.JWT_SECRET || JWT_SECRET;
        if (!secret) return res.status(500).json({ success: false, error: 'Server authentication configuration missing' });

        // 1. Master admin key override via env (server-side only)
        const adminKey = process.env.ADMIN_KEY;
        if (adminKey && (password === adminKey || username === adminKey)) {
            const token = jwt.sign(
                { userId: 'admin_master', username: 'admin', role: 'admin' },
                secret,
                { expiresIn: '24h' }
            );
            return res.json({ success: true, token, user: { username: 'admin', role: 'admin', email: 'admin@aimall.ai' } });
        }

        // 2. Query MongoDB for existing user (if connected)
        let user = null;
        if (mongoose.connection.readyState === 1) {
            try {
                user = await AdminUser.findOne({ 
                    $or: [
                        { username: username.trim() }, 
                        { email: username.trim().toLowerCase() }
                    ], 
                    isActive: true 
                });
            } catch (dbErr) {
                user = null;
            }
        }

        // 3. Fallback to ENV-defined admin credentials if user not yet in MongoDB or DB offline
        const defaultUser  = process.env.ADMIN_DEFAULT_USER;
        const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL;
        const defaultPass  = process.env.ADMIN_DEFAULT_PASSWORD;

        if (!user && defaultPass) {
            const isMatchUser = (defaultUser && username.trim() === defaultUser) || (defaultEmail && username.trim().toLowerCase() === defaultEmail.toLowerCase());
            const isMatchPass = (password === defaultPass);

            if (isMatchUser && isMatchPass) {
                const token = jwt.sign(
                    { userId: 'admin_default', username: defaultUser || 'admin', role: 'admin' },
                    secret,
                    { expiresIn: '24h' }
                );
                return res.json({ success: true, token, user: { username: defaultUser || 'admin', role: 'admin', email: defaultEmail || '' } });
            }
            return res.status(401).json({ success: false, error: 'Invalid credentials or account disabled' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            secret,
            { expiresIn: '24h' }
        );

        user.lastLogin = new Date();
        await user.save().catch(() => {});

        res.json({ success: true, token, user: { username: user.username, role: user.role, email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /api/auth/register (admin only) ─────────────────────────────────────
router.post('/register', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) return res.status(400).json({ success: false, error: 'All fields required' });

        const existing = await AdminUser.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Username or email already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await AdminUser.create({ username, email, password: hashed, role: role || 'viewer', isActive: true });

        res.json({ success: true, user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await AdminUser.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/auth/users (admin only) ─────────────────────────────────────────
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await AdminUser.find().select('-password');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── PATCH /api/auth/users/:id (admin only) ────────────────────────────────────
router.patch('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { role, isActive } = req.body;
        await AdminUser.findByIdAndUpdate(req.params.id, { 
            ...(role !== undefined && { role }), 
            ...(isActive !== undefined && { isActive }) 
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
