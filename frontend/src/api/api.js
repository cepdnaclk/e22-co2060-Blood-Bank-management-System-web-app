import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/', // Your Django API base URL
});

// Automatically add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const storedTokens = localStorage.getItem('authTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        if (tokens.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
      } catch (error) {
        console.error("Error parsing auth tokens", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = [];

const flushRefreshQueue = (newAccessToken) => {
  refreshQueue.forEach((callback) => callback(newAccessToken));
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      const storedTokens = localStorage.getItem('authTokens');
      if (!storedTokens) return Promise.reject(error);

      let tokens;
      try {
        tokens = JSON.parse(storedTokens);
      } catch {
        localStorage.removeItem('authTokens');
        return Promise.reject(error);
      }

      if (!tokens?.refresh) {
        localStorage.removeItem('authTokens');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((newAccessToken) => {
            if (!newAccessToken) return reject(error);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}auth/token/refresh/`,
          { refresh: tokens.refresh }
        );

        const refreshedTokens = {
          ...tokens,
          access: refreshResponse.data.access,
          refresh: refreshResponse.data.refresh ?? tokens.refresh,
        };

        localStorage.setItem('authTokens', JSON.stringify(refreshedTokens));
        isRefreshing = false;
        flushRefreshQueue(refreshedTokens.access);

        originalRequest.headers.Authorization = `Bearer ${refreshedTokens.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        flushRefreshQueue(null);
        localStorage.removeItem('authTokens');

        // Redirect to login page — session has fully expired
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;