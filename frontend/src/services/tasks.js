import api from './api'

export const getTasks = (filters = {}, page = 1) => {
  const params = { page }
  if (filters.completed !== '') params.completed = filters.completed
  if (filters.category !== '') params.category = filters.category
  if (filters.search) params.search = filters.search
  if (filters.ordering) params.ordering = filters.ordering
  if (filters.priority) params.priority = filters.priority
  if (filters.status) params.status = filters.status
  return api.get('/tasks/', { params }).then((r) => r.data)
}

export const getAllTasks = (filters = {}) => {
  const params = { page_size: 200 }
  if (filters.category !== '' && filters.category !== undefined) params.category = filters.category
  if (filters.priority) params.priority = filters.priority
  return api.get('/tasks/', { params }).then((r) => r.data)
}

export const createTask = (data) =>
  api.post('/tasks/', data).then((r) => r.data)

export const updateTask = (id, data) =>
  api.patch(`/tasks/${id}/`, data).then((r) => r.data)

export const deleteTask = (id) => api.delete(`/tasks/${id}/`)

export const toggleTask = (id) =>
  api.post(`/tasks/${id}/toggle/`).then((r) => r.data)

export const moveTask = (id, data) =>
  api.patch(`/tasks/${id}/move/`, data).then((r) => r.data)

export const shareTask = (id, email) =>
  api.post(`/tasks/${id}/share/`, { email }).then((r) => r.data)
