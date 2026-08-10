const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

const getApiUrl = (path) => {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
};

const apiRequest = async (path, body) => {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
};

export const registerUser = ({ username, password }) =>
  apiRequest('/api/auth/register', { username, password });

export const loginUser = ({ username, password }) =>
  apiRequest('/api/auth/login', { username, password });

export const saveUserState = ({ username, password, state }) =>
  apiRequest('/api/state/save', { username, password, state });
