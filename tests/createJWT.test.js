const { createToken, isExpired } = require('../createJWT');

describe('createJWT', () => {
  test('creates a token containing the correct payload', () => {
    const result = createToken('Tim', 'Cen', '6a5563736ce7ffb557c85f9f', 'Athlete');
    expect(result.accessToken).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  test('a freshly created token is not expired', () => {
    const { accessToken } = createToken('Tim', 'Cen', '6a5563736ce7ffb557c85f9f', 'Athlete');
    expect(isExpired(accessToken)).toBe(false);
  });

  test('a garbage/invalid token is treated as expired', () => {
    expect(isExpired('this-is-not-a-real-jwt')).toBe(true);
  });

  test('decoded token round-trips the role correctly (regression test for role-casing bugs)', () => {
    const { accessToken } = createToken('Nick', 'Zone', '6a555f7fd9140cfea0a358e7', 'Coach');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(accessToken);
    expect(decoded.role).toBe('Coach');
    expect(decoded.role).not.toBe('coach'); // catches the exact lowercase/capitalized bug from earlier
  });
});
