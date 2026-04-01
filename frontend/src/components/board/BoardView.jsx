import PropTypes from 'prop-types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllTasks, moveTask, deleteTask } from '../../services/tasks'
import BoardColumn from './BoardColumn'

const COLUMNS = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'review', label: 'Em Revisão' },
  { key: 'done', label: 'Concluído' },
]

export default function BoardView({ categories, onEdit }) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks-board'],
    queryFn: () => getAllTasks(),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }) => moveTask(id, { status, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-board'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-board'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleDrop = (taskId, newStatus) => {
    const tasks = allTasks.filter((t) => t.status === newStatus)
    const newPosition = tasks.length
    moveMutation.mutate({ id: taskId, status: newStatus, position: newPosition })
  }

  const allTasks = data?.results || []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="rounded-xl border-2 border-gray-200 bg-gray-50 min-h-[300px] animate-pulse">
            <div className="px-4 py-3 border-b border-gray-200/50">
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="text-center py-12 text-red-500">Falha ao carregar quadro.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => (
        <BoardColumn
          key={col.key}
          statusKey={col.key}
          label={col.label}
          tasks={allTasks.filter((t) => t.status === col.key)}
          categories={categories}
          onDrop={handleDrop}
          onEdit={onEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      ))}
    </div>
  )
}

BoardView.propTypes = {
  categories: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
}
