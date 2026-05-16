import { request } from './api';

const USER_KEY = 'user';

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function clearAuthToken() {
  localStorage.removeItem('token');
}

export function getAuthUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

export function setAuthUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuthUser() {
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export async function logout() {
  try {
    await request('/api/logout', { method: 'POST' });
  } catch (error) {
    // O token pode já ter expirado; o logout local ainda deve acontecer.
  } finally {
    clearAuthToken();
    clearAuthUser();
  }
}
