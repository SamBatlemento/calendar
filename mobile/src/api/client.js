import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same droplet the web app talks to. Override by editing app.json -> expo.extra.apiUrl,
// or by setting EXPO_PUBLIC_API_URL before `expo start` (see mobile/README.md).
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'https://cop4331-9.com/api';

const client = axios.create({ baseURL: API_URL });

// Attach JWT to every request (mirrors web/src/api/client.js, swaps localStorage -> AsyncStorage)
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Let AuthContext know when a token has expired so it can route back to Login.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const isLoginRequest = err.config?.url?.includes('/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      await AsyncStorage.multiRemove(['token', 'user']);
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default client;
export { API_URL };
