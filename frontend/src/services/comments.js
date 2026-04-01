import api from './api'

export const getComments = (taskId) =>
  api.get(`/tasks/${taskId}/comments/`).then((r) => r.data)

export const createComment = (taskId, content) =>
  api.post(`/tasks/${taskId}/comments/`, { content }).then((r) => r.data)

export const deleteComment = (taskId, commentId) =>
  api.delete(`/tasks/${taskId}/comments/${commentId}/`)
