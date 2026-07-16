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

export const getExercises = () => 
  client.get('/exercises');

export const getTeamMembers = () => 
  client.get('/team/members');

export const getAssignmentsForMember = (memberId) =>
  client.get(`/assignments/member/${memberId}`);

export const logExerciseTime = (assignmentId, minutes) =>
  client.post('/exercise-log', { assignmentId, minutes });

export const logMeal = ({ name, calories, time, date }) =>
  client.post('/meal-log', { meal: name, calories: Number(calories), time, date });

export const getMyMeals = () => client.get('/meal-log');

export const updateExercise = (id, { name, description, targetDurationMinutes }) =>
  client.put(`/exercises/${id}`, { name, description, targetDuration: targetDurationMinutes });

export const deleteExercise = (id) => client.delete(`/exercises/${id}`);

export const removeTeamMember = (memberId) => client.delete(`/team/members/${memberId}`);

export const updateAssignmentDueDate = (id, dueDate) => client.put(`/assignments/${id}`, { dueDate });

export const deleteAssignment = (id) => client.delete(`/assignments/${id}`);

export const updateMeal = (id, { name, calories, time, date }) =>
  client.put(`/meal-log/${id}`, { meal: name, calories: Number(calories), time, date });

export const deleteMeal = (id) => client.delete(`/meal-log/${id}`);

export const bulkAssignExercise = ({ exerciseId, dueDate }) =>
  client.post('/assignments/team', { exerciseId, dueDate });

export const createGame = ({ title, location, date }) =>
  client.post('/games', { title, location, date });

export const getGames = ({ start, end } = {}) =>
  client.get('/games', { params: { start, end } });

export const updateGame = (id, { title, location, date }) =>
  client.put(`/games/${id}`, { title, location, date });

export const deleteGame = (id) => client.delete(`/games/${id}`);