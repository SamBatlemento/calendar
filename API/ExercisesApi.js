
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

app.post('/api/exercises', verifyJWT, requireRole("Coach"), async (req, res) =>
{
    const { name, description, targetDuration } = req.body;
    let ret;

    try
    {
        // Make sure all fields are provided
        if (!name || !description || !targetDuration == null)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        // Create the exercise
        const exercise = await Exercise.create({
            name,
            description,
            targetDuration
        });

        ret =
        {
            message: "Exercise created successfully.",
            exerciseId: exercise._id
        };

        res.status(201).json(ret);
    }
    catch (e)
    {
        res.status(500).json({
            error: e.message
        });
    }
});

app.post('/api/exercise-log', verifyJWT, requireRole("Athlete"), async (req, res) =>
{
    const { assignmentId, minutes } = req.body;

    try
    {
        // Validate input
        if (!assignmentId || !minutes == null)
        {
            return res.status(400).json({
                error: "Assignment ID and minutes are required."
            });
        }

        // Make sure the assignment exists
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment)
        {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        if (!assignment.member.equals(req.user.userId)) {
            return res.status(403).json({
            error: "Not authorized."
            });
        }

        // Create the exercise log
        const log = await ExerciseLog.create({
            assignment: assignmentId,
            minutes
        });

        res.status(201).json({
            message: "Exercise time logged successfully.",
            logId: log._id
        });
    }
    catch (e)
    {
        res.status(500).json({
            error: e.message
        });
    }
});
}
