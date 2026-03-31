import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getToken, removeToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap envelope, handle 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Unwrap the { success, data } envelope
export function unwrap<T>(response: AxiosResponse): T {
  return response.data?.data ?? response.data;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

// Users (Admin)
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/admin/users", { params }),
  ban: (id: string) => api.post(`/admin/users/${id}/ban`),
  unban: (id: string) => api.post(`/admin/users/${id}/unban`),
  get: (id: string) => api.get(`/users/${id}/profile`),
};

// Tickets (Admin)
export const adminTicketsApi = {
  void: (id: string) => api.patch(`/admin/tickets/${id}/void`),
  reinstate: (id: string) => api.patch(`/admin/tickets/${id}/reinstate`),
};

// Events
export const eventsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/admin/events", { params }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: Record<string, unknown>) => api.post("/events", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  publish: (id: string) => api.post(`/events/${id}/publish`),
  cancel: (id: string) => api.post(`/events/${id}/cancel`),
  attendees: (id: string, params?: Record<string, unknown>) =>
    api.get(`/events/${id}/attendees`, { params }),
  analytics: (id: string) => api.get(`/events/${id}/analytics`),
  gates: (id: string) => api.get(`/events/${id}/gates`),
  createGate: (id: string, data: Record<string, unknown>) =>
    api.post(`/events/${id}/gates`, data),
};

// Media
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get("/admin/analytics"),
};

// Loyalty
export const loyaltyApi = {
  overview: () => api.get("/admin/loyalty"),
  leaderboard: () => api.get("/loyalty/leaderboard"),
};

// Notifications
export const notificationsApi = {
  broadcast: (data: Record<string, unknown>) =>
    api.post("/notifications/broadcast", data),
  list: (params?: Record<string, unknown>) =>
    api.get("/admin/notifications", { params }),
};

// Finances
export const financesApi = {
  overview: () => api.get("/admin/finances"),
  payouts: (params?: Record<string, unknown>) =>
    api.get("/organizer/payouts", { params }),
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/admin/orders", { params }),
};

// Organizer
export const organizerApi = {
  wallet: () => api.get('/organizer/wallet'),
  events: (params?: Record<string, unknown>) => api.get('/organizer/events', { params }),
  payouts: (params?: Record<string, unknown>) => api.get('/organizer/payouts', { params }),
  requestPayout: (data: { amount: number; phone: string; notes?: string }) =>
    api.post('/organizer/payouts/request', data),
  updatePayoutSettings: (data: Record<string, unknown>) =>
    api.patch('/organizer/payout-settings', data),
  // Admin
  adminPayouts: (params?: Record<string, unknown>) => api.get('/organizer/admin/payouts', { params }),
  approvePayout: (id: string, adminNotes?: string) =>
    api.post(`/organizer/admin/payouts/${id}/approve`, { adminNotes }),
  rejectPayout: (id: string, reason: string) =>
    api.post(`/organizer/admin/payouts/${id}/reject`, { reason }),
};

// Admin — organizers & venue analytics
export const adminApi = {
  getOrganizers: (params?: Record<string, unknown>) =>
    api.get("/admin/organizers", { params }),
  getOrganizerDetail: (id: string) => api.get(`/admin/organizers/${id}`),
  getVenueAnalytics: (id: string) => api.get(`/admin/venues/${id}/analytics`),
  inviteOrganizer: (data: { email: string; firstName: string; lastName: string; role: string; message?: string }) =>
    api.post("/admin/organizers/invite", data),
};

// Settings
export const settingsApi = {
  get: () => api.get("/admin/settings"),
  update: (data: Record<string, unknown>) =>
    api.patch("/admin/settings", data),
};

// Venues
export const venuesApi = {
  list: (params?: Record<string, unknown>) => api.get("/venues", { params }),
  get: (id: string) => api.get(`/venues/${id}`),
  create: (data: Record<string, unknown>) => api.post("/venues", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/venues/${id}`, data),
  delete: (id: string) => api.delete(`/venues/${id}`),
};

// Admin Wallet oversight
export const adminWalletApi = {
  stats: () => api.get("/admin/wallet/stats"),
  transactions: (params?: Record<string, unknown>) => api.get("/admin/wallet/transactions", { params }),
  users: (params?: Record<string, unknown>) => api.get("/admin/wallet/users", { params }),
  credit: (userId: string, amount: number, description?: string) =>
    api.post("/admin/wallet/credit", { userId, amount, description }),
  transfer: (fromUserId: string, toUserId: string, amount: number, description?: string) =>
    api.post("/admin/wallet/transfer", { fromUserId, toUserId, amount, description }),
  voidTx: (txId: string) => api.post(`/admin/wallet/transactions/${txId}/void`),
};

// Admin Waitlist oversight
export const adminWaitlistApi = {
  eventWaitlist: (eventId: string, params?: Record<string, unknown>) =>
    api.get(`/waitlist/admin/${eventId}`, { params }),
  notifyNext: (eventId: string, count?: number) =>
    api.post(`/waitlist/admin/${eventId}/notify`, { count }),
};

// Admin Waiting Room
export const adminWaitingRoomApi = {
  activate: (eventId: string) => api.post(`/waiting-room/${eventId}/activate`),
  deactivate: (eventId: string) => api.post(`/waiting-room/${eventId}/deactivate`),
  admit: (eventId: string, batchSize?: number) =>
    api.post(`/waiting-room/${eventId}/admit`, { batchSize }),
  status: (eventId: string) => api.get(`/waiting-room/${eventId}/status`),
};

// Rewards
export const rewardsApi = {
  list: () => api.get("/loyalty/rewards/all"),
  create: (data: Record<string, unknown>) => api.post("/loyalty/rewards", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/loyalty/rewards/${id}`, data),
};

// Wristband analytics + management
export const adminWristbandApi = {
  analytics: (eventId: string) => api.get(`/wristbands/events/${eventId}/analytics`),
  refundAll: (eventId: string) => api.post(`/wristbands/refund-all/${eventId}`),
};

export default api;
