require('dotenv').config();
require('./models/index.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
    console.log('Server running on port ${process.env.PORT || 5000}'));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
  
const accountApi = require('./API/AccountApi.js');
const passwordApi = require('./API/PasswordApi.js');
const memberApi = require('./API/MemberApi.js');
const exercisesApi = require('./API/ExercisesApi.js');
const assignmentsApi = require('./API/AssignmentsApi.js');
const mealApi = require('./API/MealApi.js');

accountApi.setApp(app, mongoose);
passwordApi.setApp(app, mongoose);
memberApi.setApp(app, mongoose);
exercisesApi.setApp(app, mongoose);
assignmentsApi.setApp(app, mongoose);
mealApi.setApp(app, mongoose);
