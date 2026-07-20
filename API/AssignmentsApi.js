require('express');
const Athlete = require('../models/Athlete.js');
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const Team = require('../models/Team.js');
const normalizeDay = require('../utils/normalizeDay.js');

const { verifyJWT, requireRole } = require("../middleware/auth.js");

const ExerciseLog = require('../models/ExerciseLog.js');

const handleError = require('../utils/handleError.js');

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

        if (!exercise.coach.equals(req.user.userId))
        {
            return res.status(403).json({ error: "Exercise belongs to a different coach." });
        }

        // Make sure the member exists
        const member = await Athlete.findById(memberId);

        if (!member)
        {
            return res.status(404).json({
                error: "Team member not found."
            });
        }

        const team = await Team.findOne({ coach: req.user.userId });

        if (!team || !team.members.some(m => m.equals(memberId)))
        {
            return res.status(403).json({ error: "That athlete is not on your team." });
        }

        const normalizedDue = normalizeDay(dueDate);
        if (!normalizedDue)
        {
            return res.status(400).json({ error: "Due date must be in YYYY-MM-DD format." });
        }

        const assignment = await Assignment.create({
            exercise: exerciseId,
            member: memberId,
            dueDate: normalizedDue
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
        return handleError(res, e);
    }
});

// =========================
// Assign Exercise to Entire Team (Coach)
// =========================
app.post('/api/assignments/team',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    const { exerciseId, dueDate } = req.body;

    try
    {
        // Validate input
        if (!exerciseId || !dueDate)
        {
            return res.status(400).json({
                error: "Exercise ID and due date are required."
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

        if (!exercise.coach.equals(req.user.userId))
        {
            return res.status(403).json({ error: "Exercise belongs to a different coach." });
        }

        // Get the coach's team
        const team = await Team.findOne({ coach: req.user.userId });

        if (!team || team.members.length === 0)
        {
            return res.status(404).json({
                error: "You have no athletes on your team."
            });
        }

        const normalizedDue = normalizeDay(dueDate);
        if (!normalizedDue)
        {
            return res.status(400).json({ error: "Due date must be in YYYY-MM-DD format." });
        }

        const assignments = await Assignment.insertMany(
            team.members.map(memberId => ({
                exercise: exerciseId,
                member: memberId,
                dueDate: normalizedDue
            }))
        );

        return res.status(201).json({
            message: `Assignment created for ${assignments.length} athlete(s).`,
            assignmentIds: assignments.map(a => a._id)
        });
    }
    catch (e)
    {
        return handleError(res, e);
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
            const day = new Date().toISOString().slice(0, 10); // today's UTC calendar date
            query.dueDate =
            {
                $gte: new Date(`${day}T00:00:00.000Z`),
                $lte: new Date(`${day}T23:59:59.999Z`)
            };
        }
        else if (filter === "week")
        {
            const start = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
            const end = new Date(start);
            end.setUTCDate(end.getUTCDate() + 7);
            end.setUTCHours(23, 59, 59, 999);

            query.dueDate = { $gte: start, $lte: end };
        }
        else if (date)
        {
            const window = normalizeDay(date);
            if (!window)
            {
                return res.status(400).json({ error: "Date must be in YYYY-MM-DD format." });
            }
            const end = new Date(window);
            end.setUTCHours(23, 59, 59, 999);

            query.dueDate = { $gte: window, $lte: end };
        }
        else if (req.query.start && req.query.end)
        {
            // These come from the web calendar's visible range — real instants, pass through
            query.dueDate =
            {
                $gte: new Date(req.query.start),
                $lte: new Date(req.query.end)
            };
        }

        const assignments = await Assignment.find(query)
            .populate("exercise")
            .lean();

        const logs = await ExerciseLog.find({
            assignment: { $in: assignments.map(a => a._id) }
        }).lean();

        const minutesByAssignment = {};
        for (const log of logs)
        {
            minutesByAssignment[log.assignment] = (minutesByAssignment[log.assignment] || 0) + log.minutes;
        }

        const result = assignments.map(a => ({
            ...a,
            loggedMinutes: minutesByAssignment[a._id] || null
        }));

        // FIX: was returning `assignments`, discarding loggedMinutes
        res.status(200).json(result);
    }
    catch (e)
    {
        return handleError(res, e);
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
        // FIX: assignment was referenced before it was fetched,
        // which threw a ReferenceError on every request
        const assignment = await Assignment.findById(req.params.id)
            .populate("exercise")
            .populate("member");

        if (!assignment)
        {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        const isOwner = assignment.member._id.equals(req.user.userId);
        let isTeamCoach = false;
        if (req.user.role === 'Coach')
        {
            const team = await Team.findOne({ coach: req.user.userId });
            isTeamCoach = !!team && team.members.some(m => m.equals(assignment.member._id));
        }
        if (!isOwner && !isTeamCoach)
        {
            return res.status(403).json({ error: "Not authorized." });
        }

        return res.status(200).json(assignment);
    }
    catch (e)
    {
        return handleError(res, e);
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
        const team = await Team.findOne({ coach: req.user.userId });

        if (!team || !team.members.some(m => m.equals(req.params.memberId)))
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
        return handleError(res, e);
    }
});

// =========================
// Update Assignment (Coach) - NEW
// =========================
app.put('/api/assignments/:id',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    const { dueDate } = req.body;

    try
    {
        if (!dueDate)
        {
            return res.status(400).json({
                error: "Due date is required."
            });
        }

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment)
        {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        // Make sure the assignment belongs to an athlete on this coach's team
        const team = await Team.findOne({ coach: req.user.userId });

        if (!team || !team.members.some(m => m.equals(assignment.member)))
        {
            return res.status(403).json({ error: "That athlete is not on your team." });
        }

        const normalizedDue = normalizeDay(dueDate);
        if (!normalizedDue)
        {
            return res.status(400).json({ error: "Due date must be in YYYY-MM-DD format." });
        }

        assignment.dueDate = normalizedDue;
        await assignment.save();

        return res.status(200).json({
            message: "Assignment updated successfully."
        });
    }
    catch (e)
    {
        return handleError(res, e);
    }
});

// =========================
// Delete Assignment (Coach) - NEW
// =========================
app.delete('/api/assignments/:id',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    try
    {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment)
        {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        // Make sure the assignment belongs to an athlete on this coach's team
        const team = await Team.findOne({ coach: req.user.userId });

        if (!team || !team.members.some(m => m.equals(assignment.member)))
        {
            return res.status(403).json({ error: "That athlete is not on your team." });
        }

        // Clean up any logs tied to this assignment
        await ExerciseLog.deleteMany({ assignment: assignment._id });

        await assignment.deleteOne();

        return res.status(200).json({
            message: "Assignment deleted successfully."
        });
    }
    catch (e)
    {
        return handleError(res, e);
    }
});
}