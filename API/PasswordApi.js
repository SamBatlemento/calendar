
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

app.post('/api/forgot-password', async (req, res) =>
{
    const { email } = req.body;

    try
    {
        if (!email)
        {
            return res.status(400).json({
                error: "Email is required."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        // Don't reveal whether the account exists
        if (!user)
        {
            return res.status(200).json({
                message: "If an account with that email exists, a password reset email has been sent."
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + (1000 * 60 * 30); // 30 minutes

        await user.save();

        // TODO:
        // Send the email with SendGrid
        // Example reset link:
        //
        // https://yourfrontend.com/reset-password?token=${resetToken}
        //
        // sgMail.send({
        //     to: user.email,
        //     from: process.env.EMAIL_FROM,
        //     subject: "Password Reset",
        //     text: `Reset your password using this link:
        //     https://yourfrontend.com/reset-password?token=${resetToken}`
        // });

        return res.status(200).json({
            message: "If an account with that email exists, a password reset email has been sent."
        });
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});

app.post('/api/reset-password', async (req, res) =>
{
    const { token, password } = req.body;

    try
    {
        // Validate input
        if (!token || !password)
        {
            return res.status(400).json({
                error: "Reset token and new password are required."
            });
        }

        // Find the user with the matching token
        const user = await User.findOne({
            passwordResetToken: token
        }).select("+password");

        if (!user)
        {
            return res.status(400).json({
                error: "Invalid reset token."
            });
        }

        // Check if the token has expired
        if (!user.passwordResetExpires || user.passwordResetExpires < Date.now())
        {
            return res.status(400).json({
                error: "Reset token has expired."
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password
        user.password = hashedPassword;
        user.passwordResetToken = "";
        user.passwordResetExpires = null;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully."
        });
    }
    catch (e)
    {
        return res.status(500).json({
            error: e.message
        });
    }
});
}
