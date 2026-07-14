require('express');
const token = require('../createJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User.js');

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
            return res.status(500).json({
                error: e.message
            });
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

            const user = await User.create({
                firstName,
                lastName,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                verified: false,
                verificationToken
            });

            return res.status(201).json({
                message: "Account created successfully.",
                userId: user._id
            });
        }
        catch (e)
        {
            return res.status(500).json({
                error: e.message
            });
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
            user.verificationToken = null;

            await user.save();

            return res.status(200).json({
                message: "Email verified successfully."
            });
        }
        catch (e)
        {
            return res.status(500).json({
                error: e.message
            });
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
            return res.status(500).json({
                error: e.message
            });
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
            return res.status(500).json({
                error: e.message
            });
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
            return res.status(500).json({
                error: e.message
            });
        }
    });

    // =========================
    // Get Users by Role
    // =========================
    app.get('/api/accounts/role/:role', verifyJWT, async (req, res) =>
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
            return res.status(500).json({
                error: e.message
            });
        }
    });
}
