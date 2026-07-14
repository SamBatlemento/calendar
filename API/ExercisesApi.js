
require('express');
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const ExerciseLog = require('../models/ExerciseLog.js');
const { verifyJWT, requireRole } = require("../middleware/auth.js");

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
        if (!name || !description || targetDuration == null)
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
        if (!assignmentId || minutes == null)
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

        if(assignment.completed)
        {
            return res.status(400).json({
                error: "Time has already been logged for this assignment."
            });
        }

        // Create the exercise log
        const log = await ExerciseLog.create({
            assignment: assignmentId,
            minutes
        });

        assignment.completed = true;
        await assignment.save();
    }
    catch (e)
    {
        res.status(500).json({
            error: e.message
        });
    }
});

// =========================
// Get All Exercises
// =========================
app.get('/api/exercises',
    verifyJWT,
    async (req, res) =>
{
    try
    {
        const exercises = await Exercise.find();

        return res.status(200).json(exercises);
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});

// =========================
// Get Exercise by ID
// =========================
app.get('/api/exercises/:id',
    verifyJWT,
    async (req, res) =>
{
    try
    {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise)
        {
            return res.status(404).json({
                error: "Exercise not found."
            });
        }

        return res.status(200).json(exercise);
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});

// =========================
// Get My Exercise Logs (Athlete)
// =========================
app.get('/api/exercise-log',
    verifyJWT,
    requireRole("Athlete"),
    async (req, res) =>
{
    try
    {
        const logs = await ExerciseLog.find()
            .populate({
                path: "assignment",
                match: { member: req.user.userId },
                populate: { path: "exercise" }
            });

        const filteredLogs = logs.filter(log => log.assignment);

        return res.status(200).json(filteredLogs);
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});

// =========================
// Get Exercise Log by ID
// =========================
app.get('/api/exercise-log/:id',
    verifyJWT,
    async (req, res) =>
{
    try
    {
        const log = await ExerciseLog.findById(req.params.id)
            .populate({
                path: "assignment",
                populate: "exercise"
            });

        if (!log)
        {
            return res.status(404).json({
                error: "Exercise log not found."
            });
        }

        return res.status(200).json(log);
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});
}
