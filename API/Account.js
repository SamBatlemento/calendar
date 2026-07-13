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
 
  app.post('/api/login', async(req, res) =>
  {
    const { email, password } = req.body;
    let ret;
   
    try
    {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password)))
        {
            return res.status(401).json({
            error: "Invalid email/password"
            });
        }

        if (!user.verified)
        {
            return res.status(403).json({
            error: "Please verify your email before logging in."
            });
        }

        ret = token.createToken(
            user.firstName,
            user.lastName,
            user._id,
            user.role
        );

        ret.role = user.role;
    }
    catch (e)
    {
        return res.status(500).json({
        error: e.message
        });
    }

    return res.status(200).json(ret);
});
 

  //More api calls

  app.post('/api/signup', async (req, res) =>
{
    const { firstName, lastName, email, password, role } = req.body;
    let ret;

    try
    {
        // Make sure all required fields are provided
        if (!firstName || !lastName || !email || !password || !role)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        // Check if the email is already registered
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser)
        {
            return res.status(400).json({
                error: "Email already exists."
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Create the new user
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            verified: false,
            verificationToken
        });

        ret = {
            message: "Account created successfully.",
            userId: user._id
        };
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }

    return res.status(201).json(ret);
});

//const crypto = require("crypto");

app.post('/api/verify-email', async (req, res) =>
{
    const { token } = req.body;
    let ret;

    try
    {
        if (!token)
        {
            return res.status(400).json({
                error: "Verification token is required."
            });
        }

        const user = await User.findOne({
            verificationToken: token
        });

        if (!user)
        {
            return res.status(400).json({
                error: "Invalid or expired verification token."
            });
        }

        user.verified = true;
        user.verificationToken = "";

        await user.save();

        ret =
        {
            message: "Email verified successfully."
        };
    }
    catch (e)
    {
        return res.status(500).json({
        error: e.message
        });
    }

    return res.status(200).json(ret);
});
}
