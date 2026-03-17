import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function register(email, password) {
  const { data } = await api.post('/auth/register', { email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

export async function shortenUrl(longUrl, customSlug = '', expiresAt = null) {
  const { data } = await api.post('/shorten', {
    longUrl,
    customSlug: customSlug || undefined,
    expiresAt: expiresAt || undefined,
  });
  return data;
}

export async function getStats(shortCode) {
 const { data } = await api.get(`/stats/${shortCode}`);
  return data;
}

export function getQrUrl(shortCode) {
  return `/api/qr/${shortCode}`;
}

export async function getMyUrls() {
  const { data } = await api.get('/my-urls');
  return data;
}
