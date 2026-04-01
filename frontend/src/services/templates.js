import api from './api'

export const getTemplates = () =>
  api.get('/tasks/templates/').then((r) => r.data)

export const createTemplate = (data) =>
  api.post('/tasks/templates/', data).then((r) => r.data)

export const deleteTemplate = (id) =>
  api.delete(`/tasks/templates/${id}/`)

export const useTemplate = (id) =>
  api.post(`/tasks/templates/${id}/use/`).then((r) => r.data)
