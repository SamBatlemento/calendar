
require('express');
const MealLog = require('../models/MealLog.js');
const { verifyJWT, requireRole } = require("../middleware/auth.js");

const crypto = require("crypto");

exports.setApp = function(app, mongoose)
{

app.post('/api/meal-log', verifyJWT, requireRole("Athlete"), async (req, res) =>
{
    const { meal, calories, time, date } = req.body;

    try
    {
        if (!meal || calories == null || time == null || date == null)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        const mealLog = await MealLog.create({
            member: req.user.userId,
            meal,
            calories,
            time,
            date
        });

        return res.status(201).json({
            message: "Meal logged successfully.",
            mealLogId: mealLog._id
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Get My Meal Logs (Athlete)
// =========================
app.get('/api/meal-log',
    verifyJWT,
    requireRole("Athlete"),
    async (req, res) =>
{
    try
    {
        const mealLogs = await MealLog.find({
            member: req.user.userId
        });

        return res.status(200).json(mealLogs);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Get Meal Log by ID
// =========================
app.get('/api/meal-log/:id',
    verifyJWT,
    requireRole("Athlete"),
    async (req, res) =>
{
    try
    {
        const mealLog = await MealLog.findById(req.params.id);

        if (!mealLog)
        {
            return res.status(404).json({
                error: "Meal log not found."
            });
        }

        if (!mealLog.member.equals(req.user.userId))
        {
            return res.status(403).json({
                error: "Not authorized."
            });
        }

        return res.status(200).json(mealLog);
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
}
