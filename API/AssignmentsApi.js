
require('express');
const Athlete = require('../models/Athlete.js');
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const Team = require('../models/Team.js');

const { verifyJWT, requireRole } = require("../middleware/auth.js");

const crypto = require("crypto");
const ExerciseLog = require('../models/ExerciseLog.js');

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


        const team = await Team.findOne({coach: req.user.userId });

        if(!team || !team.members.some(m => m.equals(req.params.memberId)))
        {
            return res.status(403).json({ error: "That athlete is not on your team." });
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
            .populate("exercise")
            .lean();

        const logs = await ExerciseLog.find({
            assignment: { $in: assignments.map(a => a._id) }
        }).lean();

        const minutesByAssignment = {};
        for(const log of logs)
        {
            minutesByAssignment[log.assignment] = (minutesByAssignment[log.assignment] || 0) + log.minutes;
        }

        const result = assignments.map(a => ({
            ...a,
            loggedMinutes: minutesByAssignment[a._id] || null
        }));

        res.status(200).json(assignments);
    }
    catch(err)
    {
        res.status(500).json({
            error: err.message
        });
    }
});

// =========================
// Get Assignment by ID
// =========================
app.get('/api/assignments/:id',
    verifyJWT,
    async (req, res) =>
{
    try
    {
        const isOwner = assignment.member._id.equals(req.user.userId);
        const isCoach = req.user.role === 'Coach';

        if(!isOwner && !isCoach)
        {
            return res.status(403).json({ error: "Not authorized."});
        }

        const assignment = await Assignment.findById(req.params.id)
            .populate("exercise")
            .populate("member");

        if (!assignment)
        {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        return res.status(200).json(assignment);
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});

// =========================
// Get Assignments for a Specific Athlete (Coach)
// =========================
app.get('/api/assignments/member/:memberId',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    try
    {
        const team = await Team.findOne({coach: req.user.userId });

        if(!team || !team.members.some(m => m.equals(req.params.memberId)))
        {
            return res.status(403).json({ error: "That athlete is not on your team." });
        }


        const assignments = await Assignment.find({
            member: req.params.memberId
        })
        .populate("exercise")
        .populate("member");

        return res.status(200).json(assignments);
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});
}
