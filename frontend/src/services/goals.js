import api from './api'

export const getCurrentGoal = () =>
  api.get('/auth/goals/current/').then((r) => r.data)

export const createGoal = (data) =>
  api.post('/auth/goals/', data).then((r) => r.data)

export const updateGoal = (id, data) =>
  api.patch(`/auth/goals/${id}/`, data).then((r) => r.data)
