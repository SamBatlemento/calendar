import client from './client';

export const createExercise = (data) => client.post('/exercises', data);
// data = { name, description, targetDurationMinutes }

export const assignExercise = (data) => client.post('/assignments', data);
// data = { exerciseId, athleteId, dueDate }

export const addTeamAthlete = (email) =>
  client.post('/team/athletes', { email });

export const getMyAssignments = (range) =>
  client.get('/assignments/mine', { params: { range } });
// range = 'today' | 'week'

export const logExerciseTime = (assignmentId, minutes) =>
  client.post(`/assignments/${assignmentId}/log`, { minutes });

export const logMeal = (data) => client.post('/meals', data);
// data = { name, calories, date }