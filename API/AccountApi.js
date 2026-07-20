require('express');
const token = require('../createJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User.js');
const Coach = require('../models/Coach.js');
const Athlete = require('../models/Athlete.js');
const sendEmail = require('../utils/sendEmail.js');

const { verifyJWT, requireRole } = require("../middleware/auth.js");

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 5;

function hashToken(t)
{
    return crypto.createHash('sha256').update(t).digest('hex');
}

async function issueRefreshToken(user)
{
    const raw = crypto.randomBytes(40).toString('hex');

    user.refreshTokens = (user.refreshTokens || []).filter(t => t.expiresAt > Date.now());

    user.refreshTokens.push({
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    if (user.refreshTokens.length > MAX_SESSIONS)
    {
        user.refreshTokens = user.refreshTokens.slice(-MAX_SESSIONS);
    }

    await user.save();
    return raw;
}

exports.setApp = function(app, mongoose)
{
    // =========================
    // Login
    // =========================
    app.post('/api/login', async (req, res) =>
    {
        const { email, password } = req.body;

        try
        {
            if (!email || !password)
            {
                return res.status(400).json({ error: "Email and password are required." });
            }

            const user = await User.findOne({
                email: email.toLowerCase()
            }).select('+password +refreshTokens');

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

            let ret = token.createToken(
                user.firstName,
                user.lastName,
                user._id,
                user.role
            );

            if(ret.error)
            {
                return res.status(500).json({ error: ret.error });
            }

            const refreshToken = await issueRefreshToken(user);

            return res.status(200).json({
                token: ret.accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                }
            });
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================
    // Signup
    // =========================
    app.post('/api/signup', async (req, res) =>
    {
        const { firstName, lastName, email, password, role } = req.body;

        try
        {
            if (!firstName || !lastName || !email || !password || !role)
            {
                return res.status(400).json({
                    error: "All fields are required."
                });
            }

            if(role !== 'Coach' && role !== 'Athlete')
            {
                return res.status(400).json({ error: "Role must be 'Coach' or 'Athlete'."});
            }

            const existingUser = await User.findOne({
                email: email.toLowerCase()
            });

            if (existingUser)
            {
                return res.status(400).json({
                    error: "Email already exists."
                });
            }

            if (pasword.length < 8)
            {
                return res.status(400).json({ error: "Password must be at least 8 characters." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const verificationToken = crypto.randomBytes(32).toString("hex");

            const Model = role === 'Coach' ? Coach : Athlete;
            const user = await Model.create({
                firstName,
                lastName,
                email: email.toLowerCase(),
                password: hashedPassword,
                verified: false,
                verificationToken
            });

            let emailSent = true;
            try
            {
                await sendEmail(
                    user.email,
                    'Verify your email',
                    `Click the link to verify your account: ${process.env.CLIENT_URL}/verify/${user.verificationToken}`
                );
            }
            catch (emailErr)
            {
                console.error('Verification email failed:', emailErr);
                emailSent = false;
            }

            return res.status(201).json({
                message: emailSent
                    ? "Account created. Check your email to verify your account before logging in."
                    : "Account created, but we couldn't send the verification email. Use \"Resend verification email\" on the login page.",
                emailSent,
                userId: user._id
            });
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================
    // Verify Email
    // =========================
    app.post('/api/verify-email', async (req, res) =>
    {
        const { token } = req.body;

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
            await user.save();

            return res.status(200).json({
                message: "Email verified successfully."
            });
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================
    // Resend Verification Email
    // =========================
    app.post('/api/resend-verification', async (req, res) =>
    {
        const { email } = req.body;

        try
        {
            if(!email)
            {
                return res.status(400).json({ error: "Email is required." });
            }

            const generic = {
                message: "If an unverified account with that email exists, a new verification email has been sent."
            };

            const user = await User.findOne({
                email: email.toLowerCase()
            }).select('+verificationToken');

            if (!user || user.verified)
            {
                return res.status(200).json(generic);
            }

            if (!user.verificationToken)
            {
                user.verificationToken = crypto.randomBytes(32).toString("hex");
                await user.save();
            }

            await sendEmail(
                user.email,
                'Verify your email',
                'Click the link to verify your account: ${process.env.CLIENT_URL}/verify/${user.verificationToken}'
            );

            return res.status(200).json(generic);
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================
    // Refresh Access Token
    // =========================
    app.post('/api/refresh', async (req, res) =>
    {
        const { refreshToken } = req.body;

        try
        {
            if (!refreshToken)
            {
                return res.status(400).json({ error: "Refresh token is required." });
            }

            const tokenHash = hashToken(refreshToken);

            const user = await User.findOne({
                'refreshTokens.tokenHash': tokenHash
            }).select('+refreshTokens');

            if(!user)
            {
                return res.status(401).json({ error: "Invalid refresh token." });
            }

            const stored = user.refreshTokens.find(t => t.tokenHash === tokenHash);

            if(!stored || stored.expiresAt < Date.now())
            {
                user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
                await user.save();
                return res.status(401).json({ error: "Refresh token expired. Please log in again." });
            }

            user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
            const newRefreshToken = await issueRefreshToken(user);

            const ret = token.createToken(user.firstName, user.lastName, user._id, user.role);

            if (ret.error)
            {
                return res.status(500).json({ error: ret.error });
            }

            return res.status(200).json({
                token: ret.accessToken,
                refreshToken: newRefreshToken
            });
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================
    // Logout (revoke refresh token)
    // =========================
    app.post('/api/logout', async (req, res) =>
    {
        const { refreshToken } = req.body;

        try
        {
            if (refreshToken)
            {
                const tokenHash = hashToken(refreshToken);
                await User.updateOne(
                    { 'refreshTokens.tokenHash': tokenHash },
                    { $pull: { refreshTokens: { tokenHash } } }
                );
            }
            // Always succeed — logout should never fail from the user's perspective
            return res.status(200).json({ message: "Logged out." });
        }
        catch (e)
        {
            console.error(e);
            return res.status(200).json({ message: "Logged out." });
        }
    });    

    // =========================
    // Validate JWT
    // =========================
    app.get('/api/account/validate', verifyJWT, async (req, res) =>
    {
        return res.status(200).json({
            loggedIn: true,
            userId: req.user.userId,
            role: req.user.role
        });
    });

    // =========================
    // Get Logged-in User Profile
    // =========================
    app.get('/api/account/profile', verifyJWT, async (req, res) =>
    {
        try
        {
            const user = await User.findById(req.user.userId)
                .select('-password -verificationToken');

            if (!user)
            {
                return res.status(404).json({
                    error: "User not found."
                });
            }

            return res.status(200).json(user);
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

}
