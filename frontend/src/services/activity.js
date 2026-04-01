import api from './api'

export const getActivity = () =>
  api.get('/tasks/activity/').then((r) => Array.isArray(r.data) ? r.data : r.data.results || [])
