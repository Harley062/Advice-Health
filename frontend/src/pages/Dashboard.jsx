import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, deleteTask, toggleTask } from '../services/tasks'
import { getCategories } from '../services/categories'
import { getJoke } from '../services/external'
import Navbar from '../components/layout/Navbar'
import TaskCard from '../components/tasks/TaskCard'
import TaskForm from '../components/tasks/TaskForm'
import TaskSkeleton from '../components/tasks/TaskSkeleton'
import CategoryManager from '../components/categories/CategoryManager'

const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
  { value: 'due_date', label: 'Due date (asc)' },
  { value: '-due_date', label: 'Due date (desc)' },
  { value: 'title', label: 'Title A-Z' },
  { value: '-title', label: 'Title Z-A' },
]

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ completed: '', category: '', search: '', ordering: '-created_at' })
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters, page],
    queryFn: () => getTasks(filters, page),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30,
  })

  const jokeQuery = useQuery({
    queryKey: ['joke'],
    queryFn: getJoke,
    staleTime: Infinity,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    handleFilterChange('search', searchInput)
  }, [searchInput, handleFilterChange])

  const handleEdit = useCallback((task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setShowTaskForm(false)
    setEditingTask(null)
  }, [])

  const tasks = tasksQuery.data?.results || []
  const totalCount = tasksQuery.data?.count || 0
  const pageSize = tasksQuery.data?.page_size || 10
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0
  const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {jokeQuery.data && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">😄</span>
            <div>
              <p className="font-medium text-yellow-800">{jokeQuery.data.setup}</p>
              <p className="text-yellow-700 mt-1">{jokeQuery.data.punchline}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {showCategoryManager && (
            <aside className="w-full md:w-64 shrink-0">
              <CategoryManager
                categories={categories}
                onClose={() => setShowCategoryManager(false)}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
              />
            </aside>
          )}

          <main className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCategoryManager((v) => !v)}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Categories
                </button>
                <button
                  onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  data-testid="new-task-btn"
                >
                  + New Task
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200">
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search tasks..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Go
                  </button>
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); handleFilterChange('search', '') }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.completed}
                  onChange={(e) => handleFilterChange('completed', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All</option>
                  <option value="false">Active</option>
                  <option value="true">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sort by</label>
                <select
                  value={filters.ordering}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ORDERING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {tasksQuery.isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TaskSkeleton key={i} />
                ))}
              </div>
            )}

            {tasksQuery.isError && (
              <div className="text-center py-12 text-red-500">Failed to load tasks.</div>
            )}

            {!tasksQuery.isLoading && tasks.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-lg font-medium">
                  {filters.search ? 'No tasks match your search' : 'No tasks yet'}
                </p>
                <p className="text-sm">
                  {filters.search ? 'Try a different query' : 'Create your first task to get started!'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  categories={categories}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggle={(id) => toggleMutation.mutate(id)}
                  onShare={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          categories={categories}
          onClose={handleFormClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            handleFormClose()
          }}
        />
      )}
    </div>
  )
}
