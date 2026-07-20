const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamSchema = new Schema(
{
    coach:
    {
        type: Schema.Types.ObjectId,
        ref: 'Coach',
        required: true,
        unique: true      // One coach owns one team
    },

    members:
    [
        {
            type: Schema.Types.ObjectId,
            ref: 'Athlete'
        }
    ]
},
{
    timestamps: true
});

TeamSchema.index({ members: 1 });

module.exports = mongoose.model('Team', TeamSchema);
