const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseLogSchema = new Schema(
{
    assignment:
    {
        type: Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },

    minutes:
    {
        type: Number,
        required: true,
        min: 1
    },

    loggedAt:
    {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ExerciseLog', ExerciseLogSchema);