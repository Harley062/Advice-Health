import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, deleteTask, toggleTask } from '../services/tasks'
import { getCategories } from '../services/categories'
import Navbar from '../components/layout/Navbar'
import TaskCard from '../components/tasks/TaskCard'
import TaskForm from '../components/tasks/TaskForm'
import TaskSkeleton from '../components/tasks/TaskSkeleton'
import CategoryManager from '../components/categories/CategoryManager'
import BoardView from '../components/board/BoardView'
import { BRAND } from '../constants/brand'

const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Mais recentes' },
  { value: 'created_at', label: 'Mais antigos' },
  { value: 'due_date', label: 'Prazo (crescente)' },
  { value: '-due_date', label: 'Prazo (decrescente)' },
  { value: 'title', label: 'Título A-Z' },
  { value: '-title', label: 'Título Z-A' },
  { value: 'priority', label: 'Prioridade' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
]

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ completed: '', category: '', search: '', ordering: '-created_at', priority: '' })
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [viewMode, setViewMode] = useState('list')

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters, page],
    queryFn: () => getTasks(filters, page),
    enabled: viewMode === 'list',
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks-board'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['game-profile'] })
    queryClient.invalidateQueries({ queryKey: ['weekly-goal'] })
    queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: invalidateAll,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleTask,
    onSuccess: invalidateAll,
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
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-sm p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Minhas Tarefas</h1>
                <p className="text-sm text-slate-500">{BRAND.slogan}</p>
              </div>
              <div className="flex gap-3">
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    title="Visualização em lista"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('board')}
                    className={`px-3 py-2 text-sm transition-colors ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    title="Visualização em quadro"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => setShowCategoryManager((v) => !v)}
                  className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Categorias
                </button>
                <button
                  onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:brightness-110 transition-all shadow-md"
                  data-testid="new-task-btn"
                >
                  + Nova Tarefa
                </button>
              </div>
            </div>

            {viewMode === 'list' && (
              <>
                <div className="flex flex-wrap gap-4 mb-6 bg-white/85 p-4 rounded-2xl border border-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                  <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Buscar</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Buscar tarefas..."
                        className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        Ir
                      </button>
                      {filters.search && (
                        <button
                          type="button"
                          onClick={() => { setSearchInput(''); handleFilterChange('search', '') }}
                          className="px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </form>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                      value={filters.completed}
                      onChange={(e) => handleFilterChange('completed', e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Todos</option>
                      <option value="false">Ativas</option>
                      <option value="true">Concluídas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Prioridade</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Todas as Categorias</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Ordenar por</label>
                    <select
                      value={filters.ordering}
                      onChange={(e) => handleFilterChange('ordering', e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                  <div className="text-center py-12 text-red-500">Falha ao carregar tarefas.</div>
                )}

                {!tasksQuery.isLoading && tasks.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-5xl mb-4">📋</p>
                    <p className="text-lg font-medium">
                      {filters.search ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa ainda'}
                    </p>
                    <p className="text-sm">
                      {filters.search ? 'Tente uma busca diferente' : 'Crie sua primeira tarefa para começar!'}
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
                      onShare={invalidateAll}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-600">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}

            {viewMode === 'board' && (
              <BoardView
                categories={categories}
                onEdit={handleEdit}
              />
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
            invalidateAll()
            handleFormClose()
          }}
        />
      )}
    </div>
  )
}
