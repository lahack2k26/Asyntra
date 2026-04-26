import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://freelanceos-hq4d.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getJobs = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export default api;
