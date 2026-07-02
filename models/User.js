const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const options = {discriminatoryKey: 'role', timestamps: true};

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true }, 
    },
    options
);

module.exports = mongoose.model('User', UserSchema);