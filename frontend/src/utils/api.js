const rawBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');
const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function getAuthToken() {
  return localStorage.getItem('token');
}

function buildUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function extractMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (payload.message) {
    return payload.message;
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const messages = Object.values(payload.errors).flat().filter(Boolean);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  return fallback;
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = true,
  } = options;

  const token = getAuthToken();

  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && body !== null
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(auth && token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...headers,
    },
    body:
      body !== undefined && body !== null
        ? JSON.stringify(body)
        : undefined,
  });

  // 🔹 Trata resposta vazia (ex: 204 No Content)
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, 'Não foi possível concluir a requisição.'),
      response.status,
      payload
    );
  }

  return payload;
}


export function getApiBaseUrl() {
  return API_BASE_URL;
}
