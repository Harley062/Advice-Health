import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { createTask, updateTask } from '../../services/tasks'

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
]

const STATUS_OPTIONS = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'review', label: 'Em Revisão' },
  { value: 'done', label: 'Concluído' },
]

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
]

export default function TaskForm({ task, categories, onClose, onSuccess }) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    due_date: '',
    category: '',
    priority: 'medium',
    status: 'todo',
    recurrence: 'none',
    recurrence_end_date: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        start_date: task.start_date || '',
        due_date: task.due_date || '',
        category: task.category || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        recurrence: task.recurrence || 'none',
        recurrence_end_date: task.recurrence_end_date || '',
      })
    }
  }, [task])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    const payload = {
      title: form.title,
      description: form.description,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      category: form.category || null,
      priority: form.priority,
      status: form.status,
      recurrence: form.recurrence,
      recurrence_end_date: form.recurrence_end_date || null,
    }
    try {
      if (isEdit) {
        await updateTask(task.id, payload)
      } else {
        await createTask(payload)
      }
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      setErrors(data && typeof data === 'object' ? data : { non_field_errors: ['Algo deu errado.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-md border border-white/70">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-violet-50/70 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-slate-800">
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.non_field_errors && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.non_field_errors[0]}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="task-title">
              T&iacute;tulo <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              data-testid="task-title-input"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="O que precisa ser feito?"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="task-desc">
              Descri&ccedil;&atilde;o
            </label>
            <textarea
              id="task-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Detalhes opcionais..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="priority-select">
                Prioridade
              </label>
              <select
                id="priority-select"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="status-select">
                Status
              </label>
              <select
                id="status-select"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="start-date">
                Data de Início
              </label>
              <input
                id="start-date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="due-date">
                Data de Entrega
              </label>
              <input
                id="due-date"
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category-select">
                Categoria
              </label>
              <select
                id="category-select"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nenhuma</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="recurrence-select">
                Recorrência
              </label>
              <select
                id="recurrence-select"
                name="recurrence"
                value={form.recurrence}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.recurrence !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="recurrence-end">
                Fim da Recorrência
              </label>
              <input
                id="recurrence-end"
                name="recurrence_end_date"
                type="date"
                value={form.recurrence_end_date}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="task-submit-btn"
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 disabled:brightness-95 text-white rounded-xl font-medium transition-all"
            >
              {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

TaskForm.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    start_date: PropTypes.string,
    due_date: PropTypes.string,
    category: PropTypes.number,
    priority: PropTypes.string,
    status: PropTypes.string,
    recurrence: PropTypes.string,
    recurrence_end_date: PropTypes.string,
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

TaskForm.defaultProps = { task: null }
