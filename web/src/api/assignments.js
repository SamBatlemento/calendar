import client from './client';

export const createExercise = ({ name, description, targetDurationMinutes }) =>
  client.post('/exercises', {
    name,
    description,
    targetDuration: targetDurationMinutes,
  });

export const addTeamAthlete = (email) =>
  client.post('/team/add-member', { email });

export const assignExercise = ({ exerciseId, athleteId, dueDate }) =>
  client.post('/assignments', {
    exerciseId,
    memberId: athleteId,
    dueDate,
  });

export const getMyAssignments = (range) =>
  client.get('/my-assignments', { params: { filter: range } });

export const logExerciseTime = (assignmentId, minutes) =>
  client.post('/exercise-log', { assignmentId, minutes });

export const logMeal = ({ name, calories }) =>
  client.post('/meal-log', { meal: name, calories: Number(calories) });

export const getMyMeals = () => client.get('/meal-log');