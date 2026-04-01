import api from './api'

export const getNotifications = () =>
  api.get('/auth/notifications/').then((r) => Array.isArray(r.data) ? r.data : r.data.results || [])

export const markRead = (id) =>
  api.post(`/auth/notifications/${id}/read/`).then((r) => r.data)

export const markAllRead = () =>
  api.post('/auth/notifications/read-all/').then((r) => r.data)

export const getUnreadCount = () =>
  api.get('/auth/notifications/unread-count/').then((r) => r.data)
