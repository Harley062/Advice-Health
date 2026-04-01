import PropTypes from 'prop-types'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

export default function BoardCard({ task, categories, onEdit, onDelete }) {
  const category = categories.find((c) => c.id === task.category)
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const isPastDue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', String(task.id))
        e.currentTarget.classList.add('opacity-40')
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('opacity-40')}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className={`text-sm font-medium text-gray-800 leading-tight ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            title="Editar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Excluir"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priority.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>

        {category && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </span>
        )}

        {task.due_date && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isPastDue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
            {formatDate(task.due_date)}
          </span>
        )}

        {task.shared_with_emails?.length > 0 && (
          <span className="text-[10px] text-gray-400">
            +{task.shared_with_emails.length}
          </span>
        )}
      </div>
    </div>
  )
}

BoardCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    completed: PropTypes.bool,
    due_date: PropTypes.string,
    category: PropTypes.number,
    shared_with_emails: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  categories: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}
