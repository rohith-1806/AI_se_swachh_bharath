import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const api = {
  // Public Complaints API
  submitComplaint: async (formData) => {
    const response = await apiClient.post('/api/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getComplaints: async (params = {}) => {
    const response = await apiClient.get('/api/complaints', { params });
    return response.data;
  },

  getComplaintById: async (id) => {
    const response = await apiClient.get(`/api/complaints/${id}`);
    return response.data;
  },

  // Admin Authentication & Actions
  adminLogin: async (credentials) => {
    const response = await apiClient.post('/api/admin/login', credentials);
    return response.data;
  },

  updateComplaintStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/admin/complaints/${id}/status`, { status });
    return response.data;
  },

  assignCleaningTeam: async (id) => {
    const response = await apiClient.post(`/api/admin/complaints/${id}/assign-cleaning-team`, {
      assignedAt: new Date().toISOString(),
    });
    return response.data;
  },

  testTelegram: async () => {
    const response = await apiClient.post('/api/admin/telegram/test');
    return response.data;
  },

  // CCTV Integration API
  getCameras: async () => {
    const response = await apiClient.get('/api/cctv/cameras');
    return response.data;
  },

  processCctvVideo: async (formData) => {
    const response = await apiClient.post('/api/cctv/process-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Standalone AI Test APIs
  analyzeImage: async (formData) => {
    const response = await apiClient.post('/api/ai/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeVideo: async (formData) => {
    const response = await apiClient.post('/api/ai/analyze-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAiMetrics: async () => {
    const response = await apiClient.get('/api/ai/metrics');
    return response.data;
  }
};

