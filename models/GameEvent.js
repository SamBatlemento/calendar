const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameEventSchema = new Schema(
{
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
},
{
    timestamps: true
});

module.exports = mongoose.model('GameEvent', GameEventSchema);