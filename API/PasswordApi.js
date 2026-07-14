
require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
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
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() = (1000 * 60 * 30);
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
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
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

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken
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
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully."
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// =========================
// Validate Password Reset Token
// =========================
app.get('/api/reset-password/:token', async (req, res) =>
{
    try
    {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken
        }).select("+password");


        if (!user)
        {
            return res.status(400).json({
                valid: false,
                error: "Invalid reset token."
            });
        }

        if (!user.passwordResetExpires ||
            user.passwordResetExpires < Date.now())
        {
            return res.status(400).json({
                valid: false,
                error: "Reset token has expired."
            });
        }

        return res.status(200).json({
            valid: true
        });
    }
    catch (e)
    {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
}
