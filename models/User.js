const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const options = {discriminatorKey: 'role', timestamps: true};

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true }, 
        verified: { type: Boolean, default: false },
        verificationToken: { type: String, select: false },
        passwordResetToken: { type: String, select: false },
        passwordResetExpires: { type: Date, select: false },
        refreshTokens: {
            type: [{
                tokenHash: { type: String, required: true},
                expiresAt: { type: Date, required: true },
            }],
            select: false,
        },
    },
    options
);

module.exports = mongoose.model('User', UserSchema);