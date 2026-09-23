const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = import.meta.env.PROD
  ? 'https://tjader-tuppen-management.onrender.com'
  : 'http://127.0.0.1:8000';
const API_URL = (configuredApiUrl || defaultApiUrl).replace(/\/+$/, '');

export async function request(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export async function translateToSwedish(texts, token) {
  const response = await request('/api/translate-to-swedish', {
    method: 'POST',
    body: JSON.stringify({ texts }),
  }, token);
  return response.translations;
}

export { API_URL };