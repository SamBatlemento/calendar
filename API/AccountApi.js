require('express');
const token = require('../createJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User.js');
const Coach = require('../models/Coach.js');
const Athlete = require('../models/Athlete.js');
const sendEmail = require('../utils/sendEmail.js');

const { verifyJWT, requireRole } = require("../middleware/auth.js");

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
            const user = await User.findOne({
                email: email.toLowerCase()
            }).select('+password');

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

            return res.status(200).json({
                token: ret.accessToken,
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

    // =========================
    // Get User by ID
    // =========================
    app.get('/api/account/:id', verifyJWT, async (req, res) =>
    {
        if(!mongoose.Types.ObjectId.isValid(req.params.id))
        {
            return res.status(400).json({ error: "Invalid user ID."});
        }

        try
        {
            const user = await User.findById(req.params.id)
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

    // =========================
    // Get All Users (Coach Only)
    // =========================
    app.get('/api/accounts', verifyJWT, requireRole("Coach"), async (req, res) =>
    {
        try
        {
            const users = await User.find()
                .select('-password -verificationToken');

            return res.status(200).json(users);
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================
    // Get Users by Role
    // =========================
    app.get('/api/accounts/role/:role', verifyJWT, requireRole("Coach"), async (req, res) =>
    {
        try
        {
            const users = await User.find({
                role: req.params.role
            }).select('-password -verificationToken');

            return res.status(200).json(users);
        }
        catch (e)
        {
            console.error(e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
}
