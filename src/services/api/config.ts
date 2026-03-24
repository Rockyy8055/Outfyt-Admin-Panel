import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-logout on 401 - let the calling code handle it
    // Only clear storage if we're not in the middle of login
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/') || 
                            error.config?.url?.includes('signInWithPassword');
      if (!isLoginRequest && typeof window !== 'undefined') {
        // Only clear if not a login-related request
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin') && currentPath !== '/login') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
