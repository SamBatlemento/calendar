import client from './client';

export const signup = (data) => client.post('/signup', data);
// data = { name, email, password, role: 'coach' | 'athlete' }

export const login = (data) => client.post('/login', data);
// data = { email, password } -> returns { token, user }

export const forgotPassword = (email) =>
  client.post('/forgot-password', { email });

export const resetPassword = (token, password) =>
  client.post('/reset-password', { token, password });

export const resendVerification = (email) =>
  client.post('/resend-verification', { email });

export const logout = (refreshToken) => 
  client.post('/logout', { refreshToken });

export const validateResetToken = (token) =>
  client.get(`/reset-password/${token}`);