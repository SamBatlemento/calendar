function handleError(res, e)
{
    if (e.name === 'ValidationError')
    {
        // e.g. "MealLog validation failed: time: `12:30 PM` is not a valid enum value..."
        return res.status(400).json({ error: e.message });
    }
    if (e.name === 'CastError')
    {
        return res.status(400).json({ error: "Invalid ID format." });
    }
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
}

module.exports = handleError;