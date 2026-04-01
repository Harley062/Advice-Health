import api from './api'

export const getTasks = (filters = {}, page = 1) => {
  const params = { page }
  if (filters.completed !== '') params.completed = filters.completed
  if (filters.category !== '') params.category = filters.category
  if (filters.search) params.search = filters.search
  if (filters.ordering) params.ordering = filters.ordering
  return api.get('/tasks/', { params }).then((r) => r.data)
}

export const createTask = (data) =>
  api.post('/tasks/', data).then((r) => r.data)

export const updateTask = (id, data) =>
  api.patch(`/tasks/${id}/`, data).then((r) => r.data)

export const deleteTask = (id) => api.delete(`/tasks/${id}/`)

export const toggleTask = (id) =>
  api.post(`/tasks/${id}/toggle/`).then((r) => r.data)

export const shareTask = (id, email) =>
  api.post(`/tasks/${id}/share/`, { email }).then((r) => r.data)
