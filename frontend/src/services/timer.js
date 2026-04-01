import api from './api'

export const getTimeEntries = (taskId) =>
  api.get('/tasks/time-entries/', { params: taskId ? { task: taskId } : {} }).then((r) => r.data)

export const startTimer = (taskId, isPomodoro = false) =>
  api.post('/tasks/time-entries/', {
    task: taskId,
    started_at: new Date().toISOString(),
    is_pomodoro: isPomodoro,
  }).then((r) => r.data)

export const stopTimer = (entryId) =>
  api.post(`/tasks/time-entries/${entryId}/stop/`).then((r) => r.data)

export const getActiveTimer = () =>
  api.get('/tasks/time-entries/active/').then((r) => r.data)
