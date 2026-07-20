require('express');
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const ExerciseLog = require('../models/ExerciseLog.js');
const { verifyJWT, requireRole } = require("../middleware/auth.js");

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
            targetDuration,
            coach: req.user.userId
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
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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

        if (!assignment.member.equals(req.user.userId))
        {
            return res.status(403).json({
                error: "Not authorized."
            });
        }

        if (assignment.completed)
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

        // FIX: no response was ever sent, so the request hung until timeout
        return res.status(201).json({
            message: "Exercise time logged successfully.",
            exerciseLogId: log._id
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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
        const exercises = await Exercise.find({ coach: req.user.userId });

        return res.status(200).json(exercises);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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

        if (!exercise.coach.equals(req.user.userId) || !exercise.athlete.equals(req.user.userId))
        {
            return res.status(403).json({ error: "Exercise belongs to a different coach." });
        }

        return res.status(200).json(exercise);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Update Exercise (Coach) - NEW
// =========================
app.put('/api/exercises/:id',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    const { name, description, targetDuration } = req.body;

    try
    {
        if (!name || !description || targetDuration == null)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        const exercise = await Exercise.findById(req.params.id);

        if (!exercise)
        {
            return res.status(404).json({ error: "Exercise not found." });
        }

        if (!exercise.coach.equals(req.user.userId))
        {
            return res.status(403).json({ error: "Exercise belongs to a different coach." });
        }

        exercise.name = name;
        exercise.description = description;
        exercise.targetDuration = targetDuration;
        await exercise.save();

        return res.status(200).json({
            message: "Exercise updated successfully.",
            exercise
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Delete Exercise (Coach) - NEW
// =========================
app.delete('/api/exercises/:id',
    verifyJWT,
    requireRole("Coach"),
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

        if (!exercise.coach.equals(req.user.userId))
        {
            return res.status(403).json({ error: "Exercise belongs to a different coach." });
        }

        // Block deletion if the exercise is referenced by any assignment,
        // otherwise those assignments would be left pointing at nothing
        const inUse = await Assignment.exists({ exercise: exercise._id });

        if (inUse)
        {
            return res.status(400).json({
                error: "Exercise is assigned to one or more athletes and cannot be deleted."
            });
        }

        await exercise.deleteOne();

        return res.status(200).json({
            message: "Exercise deleted successfully."
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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
        const assignmentIds = await Assignment.find({ member: req.user.userId }).distinct('_id');

        const logs = await ExerciseLog.find({ assignment: { $in: assignmentIds } })
            .populate({ path: "assignment", populate: { path: "exercise" } });

        return res.status(200).json(logs);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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

        // FIX (new): only the athlete who owns the log or a coach may view it
        const isOwner = log.assignment && log.assignment.member.equals(req.user.userId);
        const isCoach = req.user.role === 'Coach';

        if (!isOwner && !isCoach)
        {
            return res.status(403).json({ error: "Not authorized." });
        }

        return res.status(200).json(log);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
}