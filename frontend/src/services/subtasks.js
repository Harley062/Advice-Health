import api from './api'

export const getSubtasks = (taskId) =>
  api.get(`/tasks/${taskId}/subtasks/`).then((r) => r.data)

export const createSubtask = (taskId, data) =>
  api.post(`/tasks/${taskId}/subtasks/`, data).then((r) => r.data)

export const updateSubtask = (taskId, subtaskId, data) =>
  api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/`, data).then((r) => r.data)

export const deleteSubtask = (taskId, subtaskId) =>
  api.delete(`/tasks/${taskId}/subtasks/${subtaskId}/`)

export const toggleSubtask = (taskId, subtaskId) =>
  api.post(`/tasks/${taskId}/subtasks/${subtaskId}/toggle/`).then((r) => r.data)
