import { useQuery } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { getStats, exportCsv } from '../services/stats'
import { getCurrentGoal } from '../services/goals'
import Navbar from '../components/layout/Navbar'

const STATUS_CONFIG = {
  todo: { label: 'A Fazer', color: '#6B7280' },
  in_progress: { label: 'Em Andamento', color: '#3B82F6' },
  review: { label: 'Em Revisão', color: '#F59E0B' },
  done: { label: 'Concluído', color: '#10B981' },
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: '#EF4444' },
  high: { label: 'Alta', color: '#F97316' },
  medium: { label: 'Média', color: '#3B82F6' },
  low: { label: 'Baixa', color: '#6B7280' },
}

const taskShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string,
  due_date: PropTypes.string,
  priority: PropTypes.string,
  status: PropTypes.string,
})

function KpiCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      color: PropTypes.string,
    }),
  ),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

function PriorityLabel({ label, color, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{count}</span>
        <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
      </div>
    </div>
  )
}

PriorityLabel.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
}

function TaskRow({ task }) {
  const daysOverdue = task.due_date
    ? Math.ceil((new Date() - new Date(task.due_date + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    : 0
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: priorityCfg.color + '18', color: priorityCfg.color }}
          >
            {priorityCfg.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: statusCfg.color + '18', color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>
      {task.due_date && (
        <span className={`text-xs shrink-0 ml-3 px-2 py-1 rounded-full font-medium ${
          daysOverdue > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {daysOverdue > 0 ? `${daysOverdue}d atrasada` : task.due_date.split('-').reverse().join('/')}
        </span>
      )}
    </div>
  )
}

TaskRow.propTypes = {
  task: taskShape.isRequired,
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      {message}
    </div>
  )
}

EmptyChart.propTypes = {
  message: PropTypes.string.isRequired,
}

export default function Insights() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  })

  const { data: weeklyGoal } = useQuery({
    queryKey: ['weekly-goal'],
    queryFn: getCurrentGoal,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-red-500">
          Falha ao carregar estatísticas.
        </div>
      </div>
    )
  }

  const statusData = Object.entries(stats.by_status)
    .map(([key, value]) => ({
      name: STATUS_CONFIG[key]?.label || key,
      value,
      color: STATUS_CONFIG[key]?.color || '#999',
    }))
    .filter((d) => d.value > 0)

  const categoryData = stats.by_category.map((c) => ({
    name: c.category__name,
    count: c.count,
    color: c.category__color,
  }))

  const totalForPriority = Object.values(stats.by_priority).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Insights</h1>
          <button
            onClick={() => exportCsv()}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Total de Tarefas"
            value={stats.total}
            subtitle={`${stats.active} ativas`}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            color="bg-indigo-500"
          />
          <KpiCard
            title="Concluídas"
            value={stats.completed}
            subtitle={`${stats.completion_rate}% de conclusão`}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="bg-emerald-500"
          />
          <KpiCard
            title="Em Andamento"
            value={(stats.by_status.in_progress || 0) + (stats.by_status.review || 0)}
            subtitle={`${stats.by_status.in_progress || 0} progresso + ${stats.by_status.review || 0} revisão`}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            color="bg-blue-500"
          />
          <KpiCard
            title="Atrasadas"
            value={stats.overdue_count}
            subtitle={stats.overdue_count > 0 ? 'Requerem atenção' : 'Tudo em dia!'}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color={stats.overdue_count > 0 ? 'bg-red-500' : 'bg-gray-400'}
          />
        </div>

        {/* Weekly Goal + Time Tracking row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {weeklyGoal && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Meta Semanal</span>
                <span className="text-sm font-bold text-gray-900">
                  {weeklyGoal.completed_count}/{weeklyGoal.target_count}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((weeklyGoal.completed_count / weeklyGoal.target_count) * 100, 100)}%`,
                    background: weeklyGoal.completed_count >= weeklyGoal.target_count
                      ? 'linear-gradient(90deg, #10B981, #059669)'
                      : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                  }}
                />
              </div>
              {weeklyGoal.completed_count >= weeklyGoal.target_count && (
                <p className="text-xs text-emerald-600 font-medium mt-2">Meta atingida!</p>
              )}
            </div>
          )}
          {stats.total_time_seconds > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tempo Total Rastreado</span>
                <span className="text-lg font-bold text-gray-900">
                  {Math.floor(stats.total_time_seconds / 3600)}h {Math.floor((stats.total_time_seconds % 3600) / 60)}min
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Completion Rate Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Taxa de Conclusão Geral</span>
            <span className="text-sm font-bold text-gray-900">{stats.completion_rate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${stats.completion_rate}%`,
                background: stats.completion_rate >= 70
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : stats.completion_rate >= 40
                    ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                    : 'linear-gradient(90deg, #EF4444, #DC2626)',
              }}
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Distribuição por Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Nenhuma tarefa para exibir" />
            )}
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Distribuição por Prioridade</h2>
            <div className="space-y-1 mb-4">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <PriorityLabel
                  key={key}
                  label={cfg.label}
                  color={cfg.color}
                  count={stats.by_priority[key] || 0}
                  total={totalForPriority}
                />
              ))}
            </div>
            {totalForPriority > 0 ? (
              <div className="flex rounded-full overflow-hidden h-4 bg-gray-100">
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                  const pct = totalForPriority > 0 ? ((stats.by_priority[key] || 0) / totalForPriority) * 100 : 0
                  if (pct === 0) return null
                  return (
                    <div
                      key={key}
                      className="h-4 transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                      title={`${cfg.label}: ${stats.by_priority[key] || 0}`}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyChart message="Nenhuma tarefa para exibir" />
            )}
          </div>

          {/* Weekly Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Tendência Semanal (8 semanas)</h2>
            {stats.weekly_trend.some((w) => w.created > 0 || w.completed > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.weekly_trend}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Criadas"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Concluídas"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Sem dados suficientes para exibir tendência" />
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Tarefas por Categoria</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Tarefas" radius={[0, 6, 6, 0]} barSize={22}>
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Nenhuma categoria atribuída" />
            )}
          </div>
        </div>

        {/* Bottom Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <h2 className="text-base font-semibold text-gray-800">Tarefas Atrasadas</h2>
              {stats.overdue.length > 0 && (
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  {stats.overdue_count}
                </span>
              )}
            </div>
            {stats.overdue.length > 0 ? (
              <div>{stats.overdue.map((t) => <TaskRow key={t.id} task={t} />)}</div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">&#10003;</p>
                <p className="text-sm">Nenhuma tarefa atrasada!</p>
              </div>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h2 className="text-base font-semibold text-gray-800">Próximos Prazos (7 dias)</h2>
              {stats.upcoming.length > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  {stats.upcoming.length}
                </span>
              )}
            </div>
            {stats.upcoming.length > 0 ? (
              <div>{stats.upcoming.map((t) => <TaskRow key={t.id} task={t} />)}</div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">&#128197;</p>
                <p className="text-sm">Nenhum prazo nos próximos 7 dias</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
