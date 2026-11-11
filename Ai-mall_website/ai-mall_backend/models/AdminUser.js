const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
    username:   { type: String, required: true, unique: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },          // bcrypt hashed
    role:       { type: String, enum: ['admin', 'viewer'], default: 'viewer' },
    isActive:   { type: Boolean, default: true },
    lastLogin:  { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);
