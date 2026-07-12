import client from './client';

export const signup = (data) => client.post('api', data);
// data = { name, email, password, role: 'coach' | 'member' }

export const login = (data) => client.post('api', data);
// data = { email, password } -> returns { token, user }

export const forgotPassword = (email) =>
  client.post('api', { email });

export const resetPassword = (token, password) =>
  client.post('api', { token, password });
