require('express');
const Athlete = require('../models/Athlete.js');
const Team = require('../models/Team.js');
const { verifyJWT, requireRole } = require("../middleware/auth.js");
const Exercise = require('../models/Exercise.js');
const Assignment = require('../models/Assignment.js');
const ExerciseLog = require('../modles/ExerciseLog.js');

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

        const existingTeam = await Team.findOne({ members: athlete._id });
        if (existingTeam)
        {
            return res.status(400).json({
                error: existingTeam.coach.equals(coachId)
                    ? "Athlete is already on your team."
                    : "Athlete is already on another team."
            });
        }

        let team = await Team.findOneAndUpdate(
            { coach: coachId },
            { $setOnInsert: { coach: coachId, members: [] } },
            { new: true, upsert: true }
        );

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
    catch (e)
    {
        // FIX: was catch(err) with console.error(e), which threw a
        // ReferenceError inside the catch block
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Get My Team (Coach)
// =========================
app.get('/api/team',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    try
    {
        const team = await Team.findOne({
            coach: req.user.userId
        })
        .populate("coach")
        .populate("members");

        if (!team)
        {
            return res.status(404).json({
                error: "Team not found."
            });
        }

        return res.status(200).json(team);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Get Team Members
// =========================
app.get('/api/team/members',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    try
    {
        const team = await Team.findOne({
            coach: req.user.userId
        })
        .populate("members");

        if (!team)
        {
            return res.status(404).json({
                error: "Team not found."
            });
        }

        return res.status(200).json(team.members);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Remove Team Member (Coach)
// =========================
app.delete('/api/team/members/:memberId',
    verifyJWT,
    requireRole("Coach"),
    async (req, res) =>
{
    const { memberId } = req.params;

    try
    {
        const team = await Team.findOne({ coach: req.user.userId });

        if (!team)
        {
            return res.status(404).json({
                error: "Team not found."
            });
        }

        if (!team.members.some(m => m.equals(memberId)))
        {
            return res.status(404).json({
                error: "Athlete is not on the team."
            });
        }

        const exerciseIds = await Exercise.find({ coach: req.user.userId }).distinct('_id');
        const assignmentsIds = await Assignment.find({
            member: memberId,
            exercise: { $in: exerciseIds }
        }).distinct('_id');

        await ExerciseLog.deleteMany({ assignment: { $in: assignmentIds } });
        await Assignment.deleteMany({ _id: { $in: assignmentIds } });

        team.members = team.members.filter(m => !m.equals(memberId));

        await team.save();

        return res.status(200).json({
            message: "Athlete removed successfully."
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

}