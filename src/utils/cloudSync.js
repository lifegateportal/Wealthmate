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
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
};

export const loginOwner = ({ password }) =>
  apiRequest('/api/auth/login', { password });

export const saveUserState = ({ state }) =>
  apiRequest('/api/state/save', { state });

export const getCurrentSession = async () => {
  const response = await fetch(getApiUrl('/api/auth/me'), {
    method: 'GET',
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Not authenticated.');
  }

  return payload;
};

export const logoutUser = () => apiRequest('/api/auth/logout', {});
