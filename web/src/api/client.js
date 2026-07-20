import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://cop4331-9.com/api';

const client = axios.create({ baseURL: API_URL });

// Bare instance for the refresh call itself — no interceptors,
// so a 401 from /refresh can't loop back into this logic.
const bare = axios.create({ baseURL: API_URL });

// Attach JWT to every request automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single-flight refresh: concurrent 401s share one /refresh call.
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await bare.post('/refresh', { refreshToken });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken); // rotated
      return data.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function hardLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const url = original?.url || '';
    const isAuthRoute = url.includes('/login') || url.includes('/refresh') || url.includes('/logout');

    if (err.response?.status === 401 && !isAuthRoute && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original); // retry the original request
      } catch {
        hardLogout(); // refresh itself failed → session is truly over
      }
    }
    return Promise.reject(err);
  }
);

export default client;