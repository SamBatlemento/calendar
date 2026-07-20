require('dotenv').config();

const required = ['MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'CLIENT_URL'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length)
{
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
}

require('./models/index.js');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(cors({ origin: [process.env.CLIENT_URL, 'http://localhost:5173'] }));
app.use(morgan('combined'));
app.use(express.json());

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // 20 attempts per IP per window
  message: { error: 'Too many attempts. Please try again later.' }
});

app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/resend-verifcation', authLimiter);
app.use('/api/refresh', authLimiter);
app.use('/api/reset-password', authLimiter);

const mongoose = require('mongoose');

const accountApi = require('./API/AccountApi.js');
const passwordApi = require('./API/PasswordApi.js');
const memberApi = require('./API/MemberApi.js');
const exercisesApi = require('./API/ExercisesApi.js');
const assignmentsApi = require('./API/AssignmentsApi.js');
const mealApi = require('./API/MealApi.js');
const gameApi = require('./API/GameApi.js');

accountApi.setApp(app, mongoose);
passwordApi.setApp(app, mongoose);
memberApi.setApp(app, mongoose);
exercisesApi.setApp(app, mongoose);
assignmentsApi.setApp(app, mongoose);
mealApi.setApp(app, mongoose);
gameApi.setApp(app, mongoose);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
