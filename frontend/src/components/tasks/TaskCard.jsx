import PropTypes from 'prop-types'
import { useState } from 'react'
import ShareTaskModal from './ShareTaskModal'
import TaskDetail from './TaskDetail'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700 border border-red-200' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

const STATUS_CONFIG = {
  todo: { label: 'A Fazer', color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  review: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  done: { label: 'Concluído', color: 'bg-green-100 text-green-700 border border-green-200' },
}

export default function TaskCard({ task, categories, onEdit, onDelete, onToggle, onShare }) {
  const [showShare, setShowShare] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const category = categories.find((c) => c.id === task.category)
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isPastDue = task.due_date && !task.completed && new Date(task.due_date) < new Date()

  return (
    <>
      <div
        className={`bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(79,70,229,0.12)] transition-all ${
          task.completed ? 'opacity-60' : ''
        }`}
        data-testid="task-card"
      >
        <div className="flex items-start gap-4">
          <button
            onClick={() => onToggle(task.id)}
            data-testid={`toggle-${task.id}`}
            className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-300 hover:border-indigo-500'
            }`}
          >
            {task.completed && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-semibold text-slate-800 ${task.completed ? 'line-through text-slate-400' : ''}`}
                data-testid="task-title"
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="text-xs px-2 py-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => setShowShare(true)}
                  className="text-xs px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Compartilhar
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs px-2 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
                {priority.label}
              </span>

              {category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </span>
              )}
              {task.due_date && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isPastDue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Prazo: {formatDate(task.due_date)}
                </span>
              )}
              {task.subtask_progress && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                  {task.subtask_progress.done}/{task.subtask_progress.total} subtarefas
                </span>
              )}
              {task.recurrence && task.recurrence !== 'none' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Recorrente
                </span>
              )}
              {task.shared_with_emails?.length > 0 && (
                <span className="text-xs text-slate-400">
                  Compartilhada com {task.shared_with_emails.length} {task.shared_with_emails.length > 1 ? 'pessoas' : 'pessoa'}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDetail(true)}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver detalhes
            </button>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareTaskModal
          taskId={task.id}
          taskTitle={task.title}
          onClose={() => setShowShare(false)}
          onSuccess={() => {
            setShowShare(false)
            onShare()
          }}
        />
      )}
      {showDetail && (
        <TaskDetail
          task={task}
          categories={categories}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    completed: PropTypes.bool.isRequired,
    due_date: PropTypes.string,
    category: PropTypes.number,
    priority: PropTypes.string,
    status: PropTypes.string,
    recurrence: PropTypes.string,
    shared_with_emails: PropTypes.arrayOf(PropTypes.string),
    subtask_progress: PropTypes.shape({
      total: PropTypes.number,
      done: PropTypes.number,
    }),
  }).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, name: PropTypes.string, color: PropTypes.string })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
}
