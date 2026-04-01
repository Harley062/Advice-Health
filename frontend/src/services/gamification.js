import api from './api'

export const getGameProfile = () =>
  api.get('/auth/game-profile/').then((r) => r.data)

export const getUserBadges = () =>
  api.get('/auth/badges/').then((r) => r.data)

export const getAllBadges = () =>
  api.get('/auth/badges/all/').then((r) => r.data)
