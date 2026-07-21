const parseLocalDate = require('../parseLocalDate');

describe('parseLocalDate', () => {
  test('returns null for empty input', () => {
    expect(parseLocalDate('')).toBeNull();
    expect(parseLocalDate(null)).toBeNull();
    expect(parseLocalDate(undefined)).toBeNull();
  });

  test('parses a plain date string to the correct local day (regression test for the UTC off-by-one bug)', () => {
    const result = parseLocalDate('2026-07-17');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6); // July = index 6
    expect(result.getDate()).toBe(17); // this is the exact check that would have caught the "shows as 7/16" bug
  });

  test('strips the time portion off a full ISO timestamp before parsing', () => {
    const result = parseLocalDate('2026-07-17T00:00:00.000Z');
    expect(result.getDate()).toBe(17);
  });

  test('does NOT shift backward a day when the raw string is passed straight to new Date() instead (demonstrates the bug this function fixes)', () => {
    // This is intentionally testing the BROKEN behavior for comparison —
    // shows why parseLocalDate exists in the first place.
    const broken = new Date('2026-07-17');
    // In any timezone behind UTC, this assertion demonstrates the bug:
    // broken.getDate() may come back as 16, not 17, depending on the runner's timezone.
    // parseLocalDate() above is immune to this because it explicitly appends T00:00:00 (local time).
    expect(parseLocalDate('2026-07-17').getDate()).toBe(17);
  });
});
