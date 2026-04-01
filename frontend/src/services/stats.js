import api from './api'

export const getStats = () =>
  api.get('/tasks/stats/').then((r) => r.data)

export const exportCsv = () =>
  api.get('/tasks/export/', { responseType: 'blob' }).then((r) => {
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'tarefas.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  })
