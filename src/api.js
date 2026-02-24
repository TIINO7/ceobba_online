import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // Corrected URL format
});

export default api;
export const BASE_URL = "http://localhost:8000";
