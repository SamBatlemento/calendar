const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema(
{
    exercise:
    {
        type: Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },

    member:
    {
        type: Schema.Types.ObjectId,
        ref: 'Athlete',
        required: true
    },

    dueDate:
    {
        type: Date,
        required: true
    },

    completed:
    {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
