const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

const AthleteSchema = new Schema({
    dateOfBirth: { type: Date },
    weightUnit: { type: String, enum: ['kg', 'lb'], default: 'lb'},
    goals: { type: String, trim: true },
});

module.exports = User.discriminator('Athlete', AthleteSchema);