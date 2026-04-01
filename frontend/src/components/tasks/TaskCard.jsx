import { useState } from 'react'
import ShareTaskModal from './ShareTaskModal'

export default function TaskCard({ task, categories, onEdit, onDelete, onToggle, onShare }) {
  const [showShare, setShowShare] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const category = categories.find((c) => c.id === task.category)

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isPastDue = task.due_date && !task.completed && new Date(task.due_date) < new Date()

  return (
    <>
      <div
        className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
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
                : 'border-gray-300 hover:border-indigo-500'
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
                className={`font-semibold text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}`}
                data-testid="task-title"
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="text-xs px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowShare(true)}
                  className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Share
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
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
                  Due {formatDate(task.due_date)}
                </span>
              )}
              {task.shared_with_emails?.length > 0 && (
                <span className="text-xs text-gray-400">
                  Shared with {task.shared_with_emails.length} user{task.shared_with_emails.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
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
    </>
  )
}
