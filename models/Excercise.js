const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseSchema = new Schema(
{
    name:
    {
        type: String,
        required: true,
        trim: true
    },

    description:
    {
        type: String,
        required: true
    },

    targetDuration:
    {
        type: Number,
        required: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Exercise', ExerciseSchema);