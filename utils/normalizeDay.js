// Returns a Date at UTC midnight for the calendar day, or null if invalid.
// Accepts 'YYYY-MM-DD' or a full ISO string; keeps only the calendar day.
function normalizeDay(date)
{
    const day = String(date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    return new Date(`${day}T00:00:00.000Z`);
}

module.exports = normalizeDay;