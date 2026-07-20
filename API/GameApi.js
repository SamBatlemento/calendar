const GameEvent = require('../models/GameEvent.js');
const Team = require('../models/Team.js');
const normalizeDay = require('../utils/normalizeDay.js');
const { verifyJWT, requireRole } = require('../middleware/auth.js');
const handleError = require('../utils/handleError.js');

exports.setApp = function(app, mongoose)
{
    // =========================
    // Create Game Date (Coach)
    // =========================
    app.post('/api/games', verifyJWT, requireRole("Coach"), async (req, res) =>
    {
        const { title, location, date } = req.body;
        try
        {
            if (!title || !date)
            {
                return res.status(400).json({
                    error: "Title and date are required."
                });
            }
            const team = await Team.findOne({ coach: req.user.userId });
            if (!team)
            {
                return res.status(404).json({
                    error: "You don't have a team yet."
                });
            }

            const normalizedDate = normalizeDay(date);
            if (!normalizedDate)
            {
                return res.status(400).json({ error: "Date must be in YYYY-MM-DD format." });
            }

            const game = await GameEvent.create({
                team: team._id,
                coach: req.user.userId,
                title,
                location,
                date: normalizedDate
            });

            return res.status(201).json({
                message: "Game date added.",
                game
            });
        }
        catch (e)
        {
            return handleError(res, e);
        }
    });

    // =========================
    // Get Games (Coach or Athlete — anyone on the team)
    // =========================
    app.get('/api/games', verifyJWT, async (req, res) =>
    {
        try
        {
            let team;
            if (req.user.role === 'Coach')
            {
                team = await Team.findOne({ coach: req.user.userId });
            }
            else
            {
                team = await Team.findOne({ members: req.user.userId });
            }
            if (!team)
            {
                return res.status(200).json([]); // no team yet, not an error
            }

            let query = { team: team._id };
            const { start, end } = req.query;
            if (start && end)
            {
                query.date = { $gte: new Date(start), $lte: new Date(end) };
            }

            const games = await GameEvent.find(query).sort({ date: 1 });
            return res.status(200).json(games);
        }
        catch (e)
        {
            return handleError(res, e);
        }
    });

    // =========================
    // Update Game Date (Coach)
    // =========================
    app.put('/api/games/:id', verifyJWT, requireRole("Coach"), async (req, res) =>
    {
        const { title, location, date } = req.body;
        try
        {
            const game = await GameEvent.findById(req.params.id);
            if (!game)
            {
                return res.status(404).json({ error: "Game not found." });
            }
            
            if (title) game.title = title;
            if (location !== undefined) game.location = location;
            if (date)
            {
                const normalizedDate = normalizeDay(date);
                if (!normalizedDate)
                {
                    return res.status(400).json({ error: "Date must be in YYYY-MM-DD format." });
                }
                game.date = normalizedDate;
            }
            await game.save();

            return res.status(200).json({
                message: "Game updated.",
                game
            });
        }
        catch (e)
        {
            return handleError(res, e);
        }
    });

    // =========================
    // Delete Game Date (Coach)
    // =========================
    app.delete('/api/games/:id', verifyJWT, requireRole("Coach"), async (req, res) =>
    {
        try
        {
            const game = await GameEvent.findById(req.params.id);
            if (!game)
            {
                return res.status(404).json({ error: "Game not found." });
            }
            if (!game.coach.equals(req.user.userId))
            {
                return res.status(403).json({ error: "Not authorized." });
            }
            await game.deleteOne();
            return res.status(200).json({ message: "Game deleted." });
        }
        catch (e)
        {
            return handleError(res, e);
        }
    });
};