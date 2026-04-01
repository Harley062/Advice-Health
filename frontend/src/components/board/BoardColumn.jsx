import PropTypes from 'prop-types'
import { useState } from 'react'
import BoardCard from './BoardCard'

const STATUS_COLORS = {
  todo: 'border-gray-300 bg-gray-50',
  in_progress: 'border-blue-300 bg-blue-50',
  review: 'border-yellow-300 bg-yellow-50',
  done: 'border-green-300 bg-green-50',
}

const STATUS_DOT = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
}

export default function BoardColumn({ statusKey, label, tasks, categories, onDrop, onEdit, onDelete }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10)
    if (taskId) onDrop(taskId, statusKey)
  }

  const colorClass = STATUS_COLORS[statusKey] || STATUS_COLORS.todo
  const dotClass = STATUS_DOT[statusKey] || STATUS_DOT.todo

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl border-2 min-h-[300px] transition-colors ${colorClass} ${dragOver ? 'border-indigo-400 ring-2 ring-indigo-200' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200/50">
        <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            Arraste tarefas para cá
          </p>
        )}
        {tasks.map((task) => (
          <BoardCard
            key={task.id}
            task={task}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

BoardColumn.propTypes = {
  statusKey: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tasks: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  onDrop: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}
