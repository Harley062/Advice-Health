import api from './api'

export const getActivity = () =>
  api.get('/tasks/activity/').then((r) => r.data)
