import axios from "axios";

// Dynamically set the BASE_URL based on where the app is running
export const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? "http://localhost:8000" 
  : ""; // Uses the current domain automatically when deployed inside Docker

const api = axios.create({
  baseURL: BASE_URL, 
});

// Add a request interceptor to automatically attach the token
api.interceptors.request.use(
  (config) => {
    // 1. Grab the user object from sessionStorage
    const storedUser = sessionStorage.getItem('user');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      
      // 2. Check if the token exists inside the user object
      // (FastAPI's OAuth2 typically returns it as 'access_token')
      if (user && user.access_token) {
        config.headers.Authorization = `Bearer ${user.access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;