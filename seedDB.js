require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Coach = require('./models/Coach');
const Athlete = require('./models/Athlete');
const Team = require('./models/Team');
const Exercise = require('./models/Exercise');
const Assignment = require('./models/Assignment');
const ExerciseLog = require('./models/ExerciseLog');
const MealLog = require('./models/MealLog');

async function seed()
{
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for seeding...');

    // 1. Clear ALL collections, not just User
    await Promise.all([
        User.deleteMany({}),
        Team.deleteMany({}),
        Exercise.deleteMany({}),
        Assignment.deleteMany({}),
        ExerciseLog.deleteMany({}),
        MealLog.deleteMany({}),
    ]);

    const passwordHash = await bcrypt.hash('Test1234', 10);

    // 2. Add verified: true so seeded users can log in
    const coach = await Coach.create({
        email: 'coach.smith@example.com',   // 3. lowercase — schema lowercases on save,
        password: passwordHash,             //    so use lowercase in your test logins too
        firstName: 'Alex',
        lastName: 'Smith',
        bio: 'Strength & conditioning coach, 10 years experience.',
        verified: true,
    });

    const athlete1 = await Athlete.create({
        email: 'jane.doe@example.com',
        password: passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        weightUnit: 'lb',
        goals: 'Build strength for the fall season.',
        coach: coach._id,
        verified: true,
    });

    const athlete2 = await Athlete.create({
        email: 'mike.jones@example.com',
        password: passwordHash,
        firstName: 'Mike',
        lastName: 'Jones',
        weightUnit: 'kg',
        goals: 'Improve endurance.',
        coach: coach._id,
        verified: true,
    });

    // 4. Seed a Team document — this is what the API actually uses
    await Team.create({
        coach: coach._id,
        members: [athlete1._id, athlete2._id],
    });

    console.log('Seed data inserted successfully.');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Seeding failed: ', err);
    process.exit(1);
})