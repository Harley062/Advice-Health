import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from '@tanstack/react-query'
import { getAllTasks } from '../services/tasks'
import Navbar from '../components/layout/Navbar'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', badge: 'bg-red-50 text-red-600' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-600' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600' },
  low: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-500' },
}

const PRIORITY_LABELS = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
}

const STATUS_LABELS = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  review: 'Em Revisao',
  done: 'Concluido',
}

const STATUS_COLORS = {
  todo: 'bg-gray-50 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-600',
  review: 'bg-amber-50 text-amber-600',
  done: 'bg-emerald-50 text-emerald-600',
}

const categoryDetailShape = PropTypes.shape({
  name: PropTypes.string,
  color: PropTypes.string,
})

const taskShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string,
  priority: PropTypes.string,
  status: PropTypes.string,
  completed: PropTypes.bool,
  category_detail: categoryDetailShape,
})

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []

  // Previous month trailing days
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const d = new Date(year, month - 1, day)
    cells.push({ date: d, day, currentMonth: false })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ date: d, day, currentMonth: true })
  }

  // Next month leading days to fill 6 rows
  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day)
    cells.push({ date: d, day, currentMonth: false })
  }

  return cells
}

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function truncate(str, max = 20) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

function TaskPill({ task }) {
  const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium

  return (
    <div
      className={`text-xs px-1.5 py-0.5 rounded truncate leading-tight ${colors.bg} ${colors.text} ${
        task.completed ? 'line-through opacity-50' : ''
      }`}
      title={task.title}
    >
      {truncate(task.title)}
    </div>
  )
}

TaskPill.propTypes = {
  task: taskShape.isRequired,
}

function DayPopover({ tasks, dateKey, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const [y, m, d] = dateKey.split('-')
  const formatted = `${d}/${m}/${y}`

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{formatted}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma tarefa neste dia.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tasks.map((task) => {
            const pColors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
            const sColors = STATUS_COLORS[task.status] || STATUS_COLORS.todo
            return (
              <div
                key={task.id}
                className={`p-2.5 rounded-lg border border-gray-100 ${
                  task.completed ? 'opacity-50' : ''
                }`}
              >
                <p
                  className={`text-sm font-medium text-gray-800 ${
                    task.completed ? 'line-through' : ''
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${pColors.badge}`}
                  >
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${sColors}`}
                  >
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                  {task.category_detail && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: (task.category_detail.color || '#6B7280') + '18',
                        color: task.category_detail.color || '#6B7280',
                      }}
                    >
                      {task.category_detail.name}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

DayPopover.propTypes = {
  tasks: PropTypes.arrayOf(taskShape).isRequired,
  dateKey: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

function DayCell({ cell, tasks, isToday, selectedDay, onSelect }) {
  const dateKey = formatDateKey(cell.date)
  const isSelected = selectedDay === dateKey
  const visibleTasks = tasks.slice(0, 3)
  const remaining = tasks.length - 3

  return (
    <div
      className={`relative min-h-[90px] border border-gray-100 p-1.5 cursor-pointer transition-colors ${
        cell.currentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50'
      }`}
      onClick={() => onSelect(isSelected ? null : dateKey)}
    >
      <div
        className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
          isToday
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
            : cell.currentMonth
              ? 'text-gray-800'
              : 'text-gray-300'
        }`}
      >
        {cell.day}
      </div>

      <div className="space-y-0.5">
        {visibleTasks.map((task) => (
          <TaskPill key={task.id} task={task} />
        ))}
        {remaining > 0 && (
          <p className="text-xs text-indigo-500 font-medium pl-1">
            +{remaining} mais
          </p>
        )}
      </div>

      {isSelected && (
        <DayPopover
          tasks={tasks}
          dateKey={dateKey}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  )
}

DayCell.propTypes = {
  cell: PropTypes.shape({
    date: PropTypes.instanceOf(Date).isRequired,
    day: PropTypes.number.isRequired,
    currentMonth: PropTypes.bool.isRequired,
  }).isRequired,
  tasks: PropTypes.arrayOf(taskShape).isRequired,
  isToday: PropTypes.bool.isRequired,
  selectedDay: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
}

export default function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  // Calculate date range for the current month view
  const dateRange = useMemo(() => {
    const start = new Date(currentYear, currentMonth, 1)
    const end = new Date(currentYear, currentMonth + 1, 0)
    return {
      due_date_after: formatDateKey(start),
      due_date_before: formatDateKey(end),
    }
  }, [currentYear, currentMonth])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['calendar-tasks', currentYear, currentMonth],
    queryFn: () => getAllTasks(dateRange),
  })

  const allTasks = useMemo(() => {
    if (!data) return []
    return Array.isArray(data) ? data : data.results || []
  }, [data])

  // Group tasks by due_date
  const tasksByDate = useMemo(() => {
    const map = {}
    allTasks.forEach((task) => {
      if (!task.due_date) return
      if (!map[task.due_date]) map[task.due_date] = []
      map[task.due_date].push(task)
    })
    return map
  }, [allTasks])

  const calendarCells = useMemo(
    () => getCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  )

  const todayKey = formatDateKey(today)

  const goToPrevMonth = useCallback(() => {
    setSelectedDay(null)
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    setSelectedDay(null)
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }, [currentMonth])

  const goToToday = useCallback(() => {
    setSelectedDay(null)
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }, [today])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Calendario</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Mes anterior"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="min-w-[180px] text-center">
              <span className="text-lg font-semibold text-gray-800">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Proximo mes"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={goToToday}
              className="ml-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-3"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="text-center py-32 text-red-500">
              Falha ao carregar tarefas do calendario.
            </div>
          )}

          {/* Calendar grid */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, idx) => {
                const dateKey = formatDateKey(cell.date)
                const dayTasks = tasksByDate[dateKey] || []
                return (
                  <DayCell
                    key={idx}
                    cell={cell}
                    tasks={dayTasks}
                    isToday={dateKey === todayKey}
                    selectedDay={selectedDay}
                    onSelect={setSelectedDay}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="text-xs text-gray-400 font-medium">Prioridade:</span>
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
            const colors = PRIORITY_COLORS[key]
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
