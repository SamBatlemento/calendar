require('express');
const MealLog = require('../models/MealLog.js');
const { verifyJWT, requireRole } = require("../middleware/auth.js");
const normalizeDay = require('../utils/normalizeDay.js');

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

        // Accept 'YYYY-MM-DD' or a full ISO string; keep only the calendar day.
        const normalizedDate = normalizeDay(date);
        if (!normalizedDate)
        {
            return res.status(400).json({ error: "Date must be in YYYY-MM-DD format." });
        }

        const mealLog = await MealLog.create({
            member: req.user.userId,
            meal,
            calories,
            time,
            date: normalizedDate
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
        let query = { member: req.user.userId };

        const { date } = req.query;
        if (date)
        {
            const day = String(date).slice(0, 10);
            const start = new Date(`${day}T00:00:00.000Z`);
            const end = new Date(`${day}T23:59:59.999Z`);
            query.date = { $gte: start, $lte: end };
        }

        const mealLogs = await MealLog.find(query).sort({ date: 1 });
        return res.status(200).json(mealLogs);
    }
    catch (e)
    {
        return res.status(500).json({ error: e.message });
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

// =========================
// Update Meal Log (Athlete) - NEW
// =========================
app.put('/api/meal-log/:id',
    verifyJWT,
    requireRole("Athlete"),
    async (req, res) =>
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

        // Accept 'YYYY-MM-DD' or a full ISO string; keep only the calendar day.
        const normalizedDate = normalizeDay(date);
        if (!normalizedDate)
        {
            return res.status(400).json({ error: "Date must be in YYYY-MM-DD format." });
        }

        mealLog.meal = meal;
        mealLog.calories = calories;
        mealLog.time = time;
        mealLog.date = normalizedDate;

        await mealLog.save();

        return res.status(200).json({
            message: "Meal log updated successfully."
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Delete Meal Log (Athlete) - NEW
// =========================
app.delete('/api/meal-log/:id',
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

        await mealLog.deleteOne();

        return res.status(200).json({
            message: "Meal log deleted successfully."
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
}