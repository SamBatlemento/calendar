require('express');
const Athlete = require('../models/Athlete.js');
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const Team = require('../models/Team.js');

const { verifyJWT, requireRole } = require("../middleware/auth.js");

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

        // FIX: was req.params.memberId (undefined on this route), so this
        // check failed for every request and always returned 403
        const team = await Team.findOne({ coach: req.user.userId });

        if (!team || !team.members.some(m => m.equals(memberId)))
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
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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

        // Create one assignment per team member
        const assignments = await Assignment.insertMany(
            team.members.map(memberId => ({
                exercise: exerciseId,
                member: memberId,
                dueDate
            }))
        );

        return res.status(201).json({
            message: `Assignment created for ${assignments.length} athlete(s).`,
            assignmentIds: assignments.map(a => a._id)
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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
            // FIX: end date was +7 days, making "today" identical to "week"
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
        else if (req.query.start && req.query.end)
        {
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
        // FIX: was catch(err) with console.error(e)
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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
        const isCoach = req.user.role === 'Coach';

        if (!isOwner && !isCoach)
        {
            return res.status(403).json({ error: "Not authorized." });
        }

        return res.status(200).json(assignment);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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

        assignment.dueDate = dueDate;
        await assignment.save();

        return res.status(200).json({
            message: "Assignment updated successfully."
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
}