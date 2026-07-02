const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

const CoachSchema = new Schema({
    athletes: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    bio: { type: String, trim: true },
});


module.exports = User.discriminator('coach', CoachSchema);