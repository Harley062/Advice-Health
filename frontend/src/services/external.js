import api from './api'

export const getJoke = () =>
  api.get('/external/joke/').then((r) => r.data)
