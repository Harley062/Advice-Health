import PropTypes from 'prop-types'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSubtasks, createSubtask, toggleSubtask, deleteSubtask } from '../../services/subtasks'
import { getComments, createComment, deleteComment } from '../../services/comments'
import { getTimeEntries, startTimer, stopTimer, getActiveTimer } from '../../services/timer'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
}

const STATUS_CONFIG = {
  todo: { label: 'A Fazer', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
}

const RECURRENCE_LABELS = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
}

const TABS = [
  { key: 'subtasks', label: 'Subtarefas' },
  { key: 'comments', label: 'Comentários' },
  { key: 'time', label: 'Tempo' },
]

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Subtasks Tab ────────────────────────────────────────────────────────────

function SubtasksTab({ task }) {
  const queryClient = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    [queryClient],
  )

  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ['subtasks', task.id],
    queryFn: () => getSubtasks(task.id),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const addMutation = useMutation({
    mutationFn: (title) => createSubtask(task.id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] })
      invalidate()
      setNewTitle('')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (subtaskId) => toggleSubtask(task.id, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] })
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (subtaskId) => deleteSubtask(task.id, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] })
      invalidate()
    },
  })

  const handleAdd = (e) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    addMutation.mutate(title)
  }

  const completed = subtasks.filter((s) => s.completed).length
  const total = subtasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Progresso</span>
          <span className="font-medium">
            {completed}/{total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : subtasks.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma subtarefa ainda.</p>
      ) : (
        <ul className="space-y-1 max-h-60 overflow-y-auto">
          {subtasks.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <button
                onClick={() => toggleMutation.mutate(s.id)}
                className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  s.completed
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
              >
                {s.completed && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
              >
                {s.title}
              </span>
              <button
                onClick={() => deleteMutation.mutate(s.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                title="Excluir subtarefa"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Adicionar subtarefa..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={addMutation.isPending || !newTitle.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
        >
          Adicionar
        </button>
      </form>
    </div>
  )
}

SubtasksTab.propTypes = {
  task: PropTypes.object.isRequired,
}

// ─── Comments Tab ────────────────────────────────────────────────────────────

function CommentsTab({ task }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const listRef = useRef(null)
  const currentEmail = localStorage.getItem('user_email') || ''

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', task.id],
    queryFn: () => getComments(task.id),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const addMutation = useMutation({
    mutationFn: (text) => createComment(task.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setContent('')
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteComment(task.id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleSend = (e) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    addMutation.mutate(text)
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum comentário ainda.</p>
      ) : (
        <ul ref={listRef} className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="bg-gray-50 rounded-lg p-3 group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-indigo-600">{c.author_email}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                  {c.author_email === currentEmail && (
                    <button
                      onClick={() => deleteMutation.mutate(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                      title="Excluir comentário"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={2}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={addMutation.isPending || !content.trim()}
          className="self-end px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

CommentsTab.propTypes = {
  task: PropTypes.object.isRequired,
}

// ─── Time Tracking Tab ───────────────────────────────────────────────────────

function TimeTab({ task }) {
  const queryClient = useQueryClient()
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['timeEntries', task.id],
    queryFn: () => getTimeEntries(task.id),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: activeTimer, isLoading: activeLoading } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: getActiveTimer,
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // The active timer might be for a different task
  const isActiveForThisTask = activeTimer && activeTimer.task === task.id

  // Live elapsed counter
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (isActiveForThisTask && activeTimer?.started_at) {
      const update = () => {
        const start = new Date(activeTimer.started_at).getTime()
        const now = Date.now()
        setElapsed(Math.floor((now - start) / 1000))
      }
      update()
      intervalRef.current = setInterval(update, 1000)
    } else {
      setElapsed(0)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActiveForThisTask, activeTimer])

  const startMutation = useMutation({
    mutationFn: (isPomodoro) => startTimer(task.id, isPomodoro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const stopMutation = useMutation({
    mutationFn: (entryId) => stopTimer(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const formatEntryDuration = (entry) => {
    if (entry.duration_seconds) return formatDuration(entry.duration_seconds)
    if (!entry.started_at || !entry.ended_at) return '--:--:--'
    const start = new Date(entry.started_at).getTime()
    const end = new Date(entry.ended_at).getTime()
    const secs = Math.floor((end - start) / 1000)
    return formatDuration(secs)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Active timer / controls */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        {activeLoading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : isActiveForThisTask ? (
          <>
            <p className="text-xs text-gray-500 mb-1">
              Cronômetro ativo {activeTimer?.is_pomodoro ? '(Pomodoro 25 min)' : ''}
            </p>
            <p className="text-3xl font-mono font-bold text-indigo-600 mb-3">
              {formatDuration(elapsed)}
            </p>
            <button
              onClick={() => stopMutation.mutate(activeTimer.id)}
              disabled={stopMutation.isPending}
              className="px-5 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
            >
              Parar
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">Nenhum cronômetro ativo para esta tarefa</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => startMutation.mutate(false)}
                disabled={startMutation.isPending || Boolean(activeTimer)}
                className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
              >
                Iniciar
              </button>
              <button
                onClick={() => startMutation.mutate(true)}
                disabled={startMutation.isPending || Boolean(activeTimer)}
                className="px-5 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                title="Inicia sessão Pomodoro de 25 minutos"
              >
                Pomodoro
              </button>
            </div>
            {activeTimer && !isActiveForThisTask && (
              <p className="text-xs text-amber-600 mt-2">
                Existe um cronômetro ativo em outra tarefa. Pare-o antes de iniciar um novo.
              </p>
            )}
          </>
        )}
      </div>

      {/* History */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Registros recentes</h4>
        {entriesLoading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum registro de tempo ainda.</p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between text-sm px-3 py-2 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-500">{formatDateTime(entry.started_at)}</span>
                <div className="flex items-center gap-2">
                  {entry.is_pomodoro && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                      Pomodoro
                    </span>
                  )}
                  <span className="font-mono font-medium text-gray-700">
                    {formatEntryDuration(entry)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

TimeTab.propTypes = {
  task: PropTypes.object.isRequired,
}

// ─── Main TaskDetail Modal ───────────────────────────────────────────────────

export default function TaskDetail({ task, categories, onClose }) {
  const [activeTab, setActiveTab] = useState('subtasks')

  const category = categories.find((c) => c.id === task.category)
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
  const hasRecurrence = task.recurrence && task.recurrence !== 'none'

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-semibold text-gray-800 truncate">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
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
              {hasRecurrence && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                  {RECURRENCE_LABELS[task.recurrence] || task.recurrence}
                </span>
              )}
              {task.due_date && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Prazo:{' '}
                  {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
              {task.shared_with_emails?.length > 0 && (
                <span className="text-xs text-gray-400">
                  Compartilhada com {task.shared_with_emails.length}{' '}
                  {task.shared_with_emails.length > 1 ? 'pessoas' : 'pessoa'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'subtasks' && <SubtasksTab task={task} />}
          {activeTab === 'comments' && <CommentsTab task={task} />}
          {activeTab === 'time' && <TimeTab task={task} />}
        </div>
      </div>
    </div>
  )
}

TaskDetail.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    due_date: PropTypes.string,
    category: PropTypes.number,
    subtask_progress: PropTypes.string,
    recurrence: PropTypes.string,
    shared_with_emails: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, name: PropTypes.string, color: PropTypes.string }),
  ).isRequired,
}
