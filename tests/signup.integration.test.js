// Integration test example — requires a real MongoDB connection (use MONGO_TEST_URI,
// a SEPARATE database from your dev data, since this test creates and deletes real users).
// This one isn't run in the sandbox demo since it needs your actual Atlas connection —
// drop this into your project's tests/ folder and run with your real .env configured.

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // adjust path to wherever your Express app is exported from

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/signup', () => {
  test('rejects a password under 8 characters', async () => {
    const res = await request(app).post('/api/signup').send({
      firstName: 'Test',
      lastName: 'Short',
      email: 'shortpass@test.com',
      password: '1234567',
      role: 'Athlete',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  test('creates an account with valid data', async () => {
    const res = await request(app).post('/api/signup').send({
      firstName: 'Test',
      lastName: 'Valid',
      email: 'validsignup@test.com',
      password: '12345678',
      role: 'Athlete',
    });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBeDefined();
  });

  test('rejects a duplicate email', async () => {
    // relies on the account created in the previous test still existing
    const res = await request(app).post('/api/signup').send({
      firstName: 'Test',
      lastName: 'Dupe',
      email: 'validsignup@test.com',
      password: '12345678',
      role: 'Athlete',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/);
  });
});

describe('POST /api/login', () => {
  test('rejects an unverified account with 403', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'validsignup@test.com',
      password: '12345678',
    });
    expect(res.status).toBe(403);
  });

  test('rejects wrong credentials with 401', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'validsignup@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});
