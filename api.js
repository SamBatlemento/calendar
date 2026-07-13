require('express');
const token = require('./createJWT.js');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Coach = require('./models/Coach');
const Athlete = require('./models/Athlete');
const Team = require('./models/Team');
const Exercise = require('./models/Exercise');
const Assignment = require('./models/Assignment');
const ExerciseLog = require('./models/ExerciseLog');
const MealLog = require('./models/MealLog');
const {verifyJWT, requireRole} = require("./middleware/auth");

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
//-----------------------------------------------

app.post('/api/exercises', verifyJWT, requireRole("Coach"), async (req, res) =>
{
    const { name, description, targetDuration } = req.body;
    let ret;

    try
    {
        // Make sure all fields are provided
        if (!name || !description || !targetDuration)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        // Create the exercise
        const exercise = await Exercise.create({
            name,
            description,
            targetDuration
        });

        ret =
        {
            message: "Exercise created successfully.",
            exerciseId: exercise._id
        };

        res.status(201).json(ret);
    }
    catch (e)
    {
        res.status(500).json({
            error: e.message
        });
    }
});

app.post('/api/assignments', verifyJWT, requireRole("Coach"), async (req, res) =>
{
    const { exerciseId, memberId, dueDate } = req.body;
    let ret;

    try
    {
        // Validate input
        if (!exerciseId || !memberId || !dueDate)
        {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        // Make sure the exercise exists
        const exercise = await Exercise.findById(exerciseId);

        if (!exercise)
        {
            return res.status(404).json({
                error: "Exercise not found."
            });
        }

        // Make sure the member exists
        const member = await Athlete.findById(memberId);

        if (!member)
        {
            return res.status(404).json({
                error: "Team member not found."
            });
        }

        // Create the assignment
        const assignment = await Assignment.create({
            exercise: exerciseId,
            member: memberId,
            dueDate
        });

        ret =
        {
            message: "Assignment created successfully.",
            assignmentId: assignment._id
        };

        res.status(201).json(ret);
    }
    catch (e)
    {
        res.status(500).json({
            error: e.message
        });
    }
});

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

        let team = await Team.findOne({
            coach: coachId
        });

        // Create the team if it doesn't exist yet
        if (!team)
        {
            team = await Team.create({
                coach: coachId,
                members: []
            });
        }

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
    catch(err)
    {
        res.status(500).json({
            error: err.message
        });
    }
});

app.get('/api/my-assignments', verifyJWT, requireRole("Athlete"), async (req, res) =>
{
    const memberId = req.user.userId;
    const { filter, date } = req.query;

    try
    {
        if (!memberId)
        {
            return res.status(400).json({
                error: "Member ID is required."
            });
        }

        let query =
        {
            member: memberId
        };

        const today = new Date();

        if (filter === "today")
        {
            const start = new Date(today);
            start.setHours(0,0,0,0);

            const end = new Date(today);
            end.setHours(23,59,59,999);

            query.dueDate =
            {
                $gte: start,
                $lte: end
            };
        }
        else if (filter === "week")
        {
            const end = new Date(today);
            end.setDate(today.getDate() + 7);

            query.dueDate =
            {
                $gte: today,
                $lte: end
            };
        }
        else if (date)
        {
            const selected = new Date(date);

            const start = new Date(selected);
            start.setHours(0,0,0,0);

            const end = new Date(selected);
            end.setHours(23,59,59,999);

            query.dueDate =
            {
                $gte: start,
                $lte: end
            };
        }

        const assignments = await Assignment.find(query)
            .populate("exercise");

        res.status(200).json(assignments);
    }
    catch(err)
    {
        res.status(500).json({
            error: err.message
        });
    }
});

app.post('/api/exercise-log', verifyJWT, requireRole("Athlete"), async (req, res) =>
{
    const { assignmentId, minutes } = req.body;

    try
    {
        // Validate input
        if (!assignmentId || !minutes)
        {
            return res.status(400).json({
                error: "Assignment ID and minutes are required."
            });
        }

        // Make sure the assignment exists
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment)
        {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        if (!assignment.member.equals(req.user.userId)) {
            return res.status(403).json({
            error: "Not authorized."
            });
        }

        // Create the exercise log
        const log = await ExerciseLog.create({
            assignment: assignmentId,
            minutes
        });

        res.status(201).json({
            message: "Exercise time logged successfully.",
            logId: log._id
        });
    }
    catch (e)
    {
        res.status(500).json({
            error: e.message
        });
    }
});

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