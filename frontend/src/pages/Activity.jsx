import { useQuery } from '@tanstack/react-query'
import { getActivity } from '../services/activity'
import Navbar from '../components/layout/Navbar'

const ACTION_CONFIG = {
  created: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    color: 'bg-green-500',
    ring: 'ring-green-100',
    label: 'Criada',
  },
  completed: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    color: 'bg-emerald-500',
    ring: 'ring-emerald-100',
    label: 'Concluida',
  },
  updated: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: 'bg-blue-500',
    ring: 'ring-blue-100',
    label: 'Atualizada',
  },
  deleted: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    color: 'bg-red-500',
    ring: 'ring-red-100',
    label: 'Excluida',
  },
  commented: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'bg-purple-500',
    ring: 'ring-purple-100',
    label: 'Comentario',
  },
  shared: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    color: 'bg-blue-400',
    ring: 'ring-blue-100',
    label: 'Compartilhada',
  },
  moved: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ),
    color: 'bg-yellow-500',
    ring: 'ring-yellow-100',
    label: 'Movida',
  },
  reopened: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 010 10H9m4-10l-4-4m4 4l-4 4" />
      </svg>
    ),
    color: 'bg-orange-500',
    ring: 'ring-orange-100',
    label: 'Reaberta',
  },
}

function formatRelativeTime(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSeconds < 60) return 'agora mesmo'
  if (diffMinutes < 60) return `ha ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `ha ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7) return `ha ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  if (diffWeeks < 5) return `ha ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`
  return `ha ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`
}

function TimelineEntry({ activity, isLast }) {
  const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.updated

  return (
    <div className="relative flex gap-4">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* Icon */}
      <div
        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ring-4 ${config.color} ${config.ring}`}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800">{activity.description}</p>
              {activity.task_title && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  Tarefa: <span className="font-medium text-gray-700">{activity.task_title}</span>
                </p>
              )}
              {activity.user_email && (
                <p className="text-xs text-gray-400 mt-0.5">{activity.user_email}</p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
              {formatRelativeTime(activity.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 pb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Activity() {
  const { data: activities, isLoading, isError } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    staleTime: 1000 * 60,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Atividades Recentes</h1>
            <p className="text-sm text-gray-500">Historico de acoes realizadas</p>
          </div>
        </div>

        {isLoading && <TimelineSkeleton />}

        {isError && (
          <div className="text-center py-16 text-red-500">
            Falha ao carregar atividades.
          </div>
        )}

        {!isLoading && !isError && activities?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium">Nenhuma atividade registrada</p>
            <p className="text-sm mt-1">As atividades aparecerao aqui conforme voce utilizar o sistema</p>
          </div>
        )}

        {!isLoading && !isError && activities?.length > 0 && (
          <div>
            {activities.map((activity, index) => (
              <TimelineEntry
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
