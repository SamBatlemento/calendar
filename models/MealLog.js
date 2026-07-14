const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MealLogSchema = new Schema(
{
    member:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Athlete',
        required: true
    },

    meal:
    {
        type: String,
        required: true,
        trim: true
    },

    calories:
    {
        type: Number,
        required: true,
        min: 0
    },

    time:
    {
        type: String,
        required: true,
        trim: true
    },

    date:
    {
        type: Date,
        required: true
    },

    loggedAt:
    {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MealLog', MealLogSchema);
