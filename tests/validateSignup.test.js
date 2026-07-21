const validateSignup = require('../API/validateSignup');

describe('validateSignup', () => {
  const validInput = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'Jane.Doe@Example.com',
    password: '12345678',
    role: 'Athlete',
  };

  test('accepts valid input and lowercases the email', () => {
    const result = validateSignup(validInput);
    expect(result.valid).toBe(true);
    expect(result.normalizedEmail).toBe('jane.doe@example.com');
  });

  test('rejects when any required field is missing', () => {
    const result = validateSignup({ ...validInput, firstName: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('All fields are required.');
  });

  test('rejects passwords under 8 characters', () => {
    const result = validateSignup({ ...validInput, password: '1234567' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters.');
  });

  test('accepts a password exactly 8 characters long (boundary check)', () => {
    const result = validateSignup({ ...validInput, password: '12345678' });
    expect(result.valid).toBe(true);
  });

  test('rejects an invalid role', () => {
    const result = validateSignup({ ...validInput, role: 'Admin' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Role must be Coach or Athlete.');
  });

  test('accepts both valid roles', () => {
    expect(validateSignup({ ...validInput, role: 'Coach' }).valid).toBe(true);
    expect(validateSignup({ ...validInput, role: 'Athlete' }).valid).toBe(true);
  });
});
