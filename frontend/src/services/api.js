const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('lms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getMe: () => request('/auth/me'),
  getPersonas: () => request('/auth/personas'),
  switchPersona: (userId) => request('/auth/switch-persona', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),

  // Leaves
  getLeaves: (status = '') => request(`/leaves${status ? `?status=${status}` : ''}`),
  getStats: () => request('/leaves/stats/summary'),
  getLeaveById: (id) => request(`/leaves/${id}`),
  createLeave: (data) => request('/leaves', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  tutorAction: (id, data) => request(`/leaves/${id}/tutor-action`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  principalAction: (id, data) => request(`/leaves/${id}/principal-action`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' })
};
