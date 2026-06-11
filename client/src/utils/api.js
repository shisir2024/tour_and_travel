const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  
  // If running in development (Vite), default to localhost:5001
  if (import.meta.env.DEV) {
    return 'http://localhost:5001';
  }
  
  // In production, if served by the backend, use relative path
  // If served elsewhere, this might need an environment variable
  return window.location.origin;
};

export const API_BASE_URL = `${getBaseUrl()}/api`;
export const SOCKET_URL   = getBaseUrl();

export const apiFetch = async (path, { method = 'GET', body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res  = await fetch(`${API_BASE_URL}${path}`, { 
    method, 
    headers, 
    body: body ? JSON.stringify(body) : undefined 
  });
  
  const data = await res.json();
  if (!res.ok) {
    // Token expired or invalid — clear storage and redirect to login
    if (res.status === 401) {
      ['isLoggedIn','loggedInUser','userRole','loggedInEmail','userId','authToken']
        .forEach(k => localStorage.removeItem(k));
      window.location.href = '/login';
      return;
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
};
