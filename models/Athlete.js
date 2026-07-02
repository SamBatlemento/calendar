const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

const AthleteSchema = new Schema({
    coach: { type: Schema.Types.ObjectId, ref: 'User'},
    dateOfBirth: { type: Date },
    weightUnit: { type: String, enum: ['kg', 'lb'], default: 'lb'},
    goals: { type: String, trim: true },
});

module.exports = User.discriminator('athlete', AthleteSchema);