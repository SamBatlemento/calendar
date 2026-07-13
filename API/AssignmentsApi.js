
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

app.post('/api/assignments', verifyJWT, requireRole("Coach"), async (req, res) =>
{
    const { exerciseId, memberId, dueDate } = req.body;
    let ret;

    try
    {
        // Validate input
        if (!exerciseId || !memberId || !dueDate)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        // Make sure the exercise exists
        const exercise = await Exercise.findById(exerciseId);

        if (!exercise)
        {
            return res.status(404).json({
                error: "Exercise not found."
            });
        }

        // Make sure the member exists
        const member = await Athlete.findById(memberId);

        if (!member)
        {
            return res.status(404).json({
                error: "Team member not found."
            });
        }

        // Create the assignment
        const assignment = await Assignment.create({
            exercise: exerciseId,
            member: memberId,
            dueDate
        });

        ret =
        {
            message: "Assignment created successfully.",
            assignmentId: assignment._id
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

app.get('/api/my-assignments', verifyJWT, requireRole("Athlete"), async (req, res) =>
{
    const memberId = req.user.userId;
    const { filter, date } = req.query;

    try
    {
        if (!memberId)
        {
            return res.status(400).json({
                error: "Member ID is required."
            });
        }

        let query =
        {
            member: memberId
        };

        const today = new Date();

        if (filter === "today")
        {
            const start = new Date(today);
            start.setHours(0,0,0,0);

            const end = new Date(today);
            end.setHours(23,59,59,999);

            query.dueDate =
            {
                $gte: start,
                $lte: end
            };
        }
        else if (filter === "week")
        {
            const end = new Date(today);
            end.setDate(today.getDate() + 7);

            query.dueDate =
            {
                $gte: today,
                $lte: end
            };
        }
        else if (date)
        {
            const selected = new Date(date);

            const start = new Date(selected);
            start.setHours(0,0,0,0);

            const end = new Date(selected);
            end.setHours(23,59,59,999);

            query.dueDate =
            {
                $gte: start,
                $lte: end
            };
        }

        const assignments = await Assignment.find(query)
            .populate("exercise");

        res.status(200).json(assignments);
    }
    catch(err)
    {
        res.status(500).json({
            error: err.message
        });
    }
});
}
