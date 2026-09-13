import axios from "axios";
import { getFriendlyErrorMessage } from "../utils/errorHandler";

const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const cleanBaseURL = rawBaseURL.replace(/\/+$/, "");
const baseURL = cleanBaseURL.endsWith("/api") ? cleanBaseURL : `${cleanBaseURL}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("medicareUser"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("medicareUser");
      window.location.href = "/login";
    }
    error.friendlyMessage = getFriendlyErrorMessage(error);
    return Promise.reject(error);
  }
);

export default api;
