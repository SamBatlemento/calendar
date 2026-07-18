import client from './client';

export const login = (data) => client.post('/login', data);
// data = { email, password } -> { token, user: { id, firstName, lastName, email, role } }

export const signup = (data) => client.post('/signup', data);
// data = { firstName, lastName, email, password, role: 'Coach' | 'Athlete' }

export const forgotPassword = (email) => client.post('/forgot-password', { email });

export const resetPassword = (token, password) =>
  client.post('/reset-password', { token, password });
