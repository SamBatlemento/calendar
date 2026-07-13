
require('express');
const token = require('../createJWT.js');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
const Coach = require('../models/Coach.js');
const Athlete = require('../models/Athlete.js');
const Team = require('../models/Team.js');
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const ExerciseLog = require('../models/ExerciseLog.js');
const MealLog = require('../models/MealLog.js');
const {verifyJWT, requireRole} = require("../middleware/auth.js");

const crypto = require("crypto");

exports.setApp = function(app, mongoose)
{

app.post('/api/team/add-member', verifyJWT, requireRole("Coach"), async (req, res) =>
{
    const coachId = req.user.userId;
    const { email } = req.body;

    try
    {
        if (!coachId || !email)
        {
            return res.status(400).json({
                error: "Coach ID and email are required."
            });
        }

        const athlete = await Athlete.findOne({
            email: email.toLowerCase()
        });

        if (!athlete)
        {
            return res.status(404).json({
                error: "Athlete not found."
            });
        }

        let team = await Team.findOne({
            coach: coachId
        });

        // Create the team if it doesn't exist yet
        if (!team)
        {
            team = await Team.create({
                coach: coachId,
                members: []
            });
        }

        // Prevent duplicate members
        if (team.members.some(member => member.equals(athlete._id)))
        {
            return res.status(400).json({
                error: "Athlete is already on the team."
            });
        }

        team.members.push(athlete._id);

        await team.save();

        res.status(200).json({
            message: "Athlete added successfully."
        });
    }
    catch(err)
    {
        res.status(500).json({
            error: err.message
        });
    }
});
}
