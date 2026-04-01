import api from './api'

export const getStats = () =>
  api.get('/tasks/stats/').then((r) => r.data)
