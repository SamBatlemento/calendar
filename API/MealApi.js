
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

app.post('/api/meal-log', verifyJWT, requireRole("Athlete"), async (req, res) =>
{
    const { meal, calories } = req.body;

    try
    {
        // Validate input
        if (!meal || calories == null)
        {
            return res.status(400).json({
                error: "Meal and calories are required."
            });
        }

        // Create the meal log
        const mealLog = await MealLog.create({
            meal,
            calories
        });

        res.status(201).json({
            message: "Meal logged successfully.",
            mealLogId: mealLog._id
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
