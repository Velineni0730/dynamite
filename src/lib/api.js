import { firebaseAuth } from './firebase';

const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const API_BASE_URL = rawBase.replace(/\/$/, '');
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')).replace(/\/$/, '');

export async function api(path, options = {}) {
  const token = await firebaseAuth?.currentUser?.getIdToken();
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot reach Dynamite API. Check that the backend is running and VITE_API_BASE_URL is correct.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export const jsonRequest = (method, body) => ({ method, body: JSON.stringify(body) });
