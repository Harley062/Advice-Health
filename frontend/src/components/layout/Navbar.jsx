import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { getNotifications, markRead, markAllRead, getUnreadCount } from '../../services/notifications'

const NAV_LINKS = [
  { path: '/', label: 'Tarefas' },
  { path: '/insights', label: 'Insights' },
  { path: '/calendar', label: 'Calendário' },
  { path: '/gamification', label: 'Conquistas' },
]

const NOTIF_ICONS = {
  deadline: '⏰',
  overdue: '🔴',
  shared: '🔗',
  comment: '💬',
  badge: '🏆',
  streak: '🔥',
  goal: '🎯',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const notifRef = useRef(null)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: showNotifs,
    staleTime: 0,
    gcTime: 0,
  })

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const unreadCount = unreadData?.count || 0
  const notifList = Array.isArray(notifications) ? notifications : []

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span
            className="text-xl font-bold text-indigo-600 cursor-pointer"
            onClick={() => navigate('/')}
          >
            To-Do App
          </span>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.path
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                const next = !showNotifs
                if (next) queryClient.invalidateQueries({ queryKey: ['notifications'] })
                setShowNotifs(next)
              }}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-800">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate()}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifList.length === 0 ? (
                    <p className="text-center py-8 text-sm text-gray-400">Nenhuma notificação</p>
                  ) : (
                    notifList.map((n) => (
                      <div
                        key={n.id}
                        className={`px-3 py-2.5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !n.read ? 'bg-indigo-50/50' : ''
                        }`}
                        onClick={() => {
                          if (!n.read) markReadMutation.mutate(n.id)
                          if (n.task) {
                            setShowNotifs(false)
                            navigate('/')
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base shrink-0">{NOTIF_ICONS[n.notification_type] || '📌'}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{n.title}</p>
                            <p className="text-xs text-gray-500 truncate">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.created_at)}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user && (
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Sair
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-gray-100 px-4 py-2 bg-white">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setShowMobileMenu(false) }}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </button>
            )
          })}
        </div>
      )}
    </nav>
  )
}
