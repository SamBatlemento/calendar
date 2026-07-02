require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Coach = require('./models/Coach');
const Athlete = require('./models/Athlete');

async function seed()
{
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for seeding...');

    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('Test1234', 10);

    const coach = await Coach.create({
        email: 'Coach.smith@example.com',
        password: passwordHash,
        firstName: 'Alex',
        lastName: 'Smith',
        bio: 'Strength & conditioning coach, 10 years experience.',
    });

    const athlete1 = await Athlete.create({
    email: 'jane.doe@example.com',
    password: passwordHash,
    firstName: 'Jane',
    lastName: 'Doe',
    weightUnit: 'lb',
    goals: 'Build strength for the fall season.',
    coach: coach._id,
  });

  const athlete2 = await Athlete.create({
    email: 'mike.jones@example.com',
    password: passwordHash,
    firstName: 'Mike',
    lastName: 'Jones',
    weightUnit: 'kg',
    goals: 'Improve endurance.',
    coach: coach._id,
  });

  coach.athletes = [athlete1._id, athlete2._id];
  await coach.save();


  console.log('Seed data inserted successfully.');

  await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Seeding failed: ', err);
    process.exit(1);
})