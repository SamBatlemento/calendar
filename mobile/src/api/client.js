import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'https://cop4331-9.com/api';

const client = axios.create({ baseURL: API_URL });
const bare = axios.create({ baseURL: API_URL }); // for /refresh only

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await bare.post('/refresh', { refreshToken });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
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
        return client(original);
      } catch {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        onUnauthorized();
      }
    }
    return Promise.reject(err);
  }
);

export default client;
export { API_URL };