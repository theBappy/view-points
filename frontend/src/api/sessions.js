import { axiosInstance } from "../libs/axios";

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/sessions", data);
    return response.data;
  },
  getActiveSessions: async (data) => {
    const response = await axiosInstance.get("/sessions/active", data);
    return response.data;
  },
  getMyRecentSessions: async (data) => {
    const response = await axiosInstance.get("/sessions/my-recent", data);
    return response.data;
  },
  getSessionById: async (data) => {
    const response = await axiosInstance.get(`/sessions/${id}`, data);
    return response.data;
  },
  joinSession: async (data) => {
    const response = await axiosInstance.post(`/sessions/${id}/join`, data);
    return response.data;
  },
  endSession: async (data) => {
    const response = await axiosInstance.post(`/sessions/${id}/end`, data);
    return response.data;
  },
  getStreamToken: async () => {
    const response = await axiosInstance.post(`/chat/token`);
    return response.data;
  },
};
