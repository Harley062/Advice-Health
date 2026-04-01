import { useState } from 'react'
import PropTypes from 'prop-types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGameProfile, getUserBadges, getAllBadges } from '../services/gamification'
import { getCurrentGoal, createGoal } from '../services/goals'
import Navbar from '../components/layout/Navbar'

const profileShape = PropTypes.shape({
  level: PropTypes.number,
  xp_for_next_level: PropTypes.number,
  xp_progress: PropTypes.number,
  streak_current: PropTypes.number,
  streak_best: PropTypes.number,
  tasks_completed_total: PropTypes.number,
  xp: PropTypes.number,
})

const goalShape = PropTypes.shape({
  completed_count: PropTypes.number,
  target_count: PropTypes.number,
})

const badgeShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.string,
  name: PropTypes.string,
  description: PropTypes.string,
})

function getMonday() {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const dayStr = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

function ProfileCard({ profile }) {
  const xpPercent = profile.xp_for_next_level > 0
    ? Math.min(100, Math.round((profile.xp_progress / profile.xp_for_next_level) * 100))
    : 0

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Level */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-extrabold leading-none">{profile.level}</p>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">Nivel</p>
            </div>
          </div>
        </div>

        {/* Stats & XP */}
        <div className="flex-1 w-full">
          {/* XP Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-indigo-200">Experiencia</span>
              <span className="text-sm font-bold">{profile.xp_progress} / {profile.xp_for_next_level} XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${xpPercent}%`,
                  background: 'linear-gradient(90deg, #A78BFA, #F472B6, #FB923C)',
                }}
              />
            </div>
            <p className="text-xs text-indigo-300 mt-1">{xpPercent}% para o proximo nivel</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Streak */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">&#128293;</div>
              <p className="text-xl font-bold">{profile.streak_current}</p>
              <p className="text-xs text-indigo-200">
                {profile.streak_current === 1 ? 'dia seguido' : 'dias seguidos'}
              </p>
            </div>

            {/* Best Streak */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">&#127942;</div>
              <p className="text-xl font-bold">{profile.streak_best}</p>
              <p className="text-xs text-indigo-200">melhor sequencia</p>
            </div>

            {/* Total Tasks */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">&#9989;</div>
              <p className="text-xl font-bold">{profile.tasks_completed_total}</p>
              <p className="text-xs text-indigo-200">tarefas concluidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total XP */}
      <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between">
        <span className="text-sm text-indigo-200">XP Total</span>
        <span className="text-lg font-bold">{profile.xp} XP</span>
      </div>
    </div>
  )
}

ProfileCard.propTypes = {
  profile: profileShape.isRequired,
}

function WeeklyGoalCard({ goal, onCreateGoal, isCreating }) {
  const [targetCount, setTargetCount] = useState(5)

  const handleCreate = () => {
    onCreateGoal({
      week_start: getMonday(),
      target_count: targetCount,
    })
  }

  if (!goal) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xl">&#127919;</div>
          <h2 className="text-base font-semibold text-gray-800">Meta Semanal</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Defina quantas tarefas deseja completar esta semana
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Quantidade de tarefas
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 self-end flex items-center gap-2"
          >
            {isCreating && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Definir Meta Semanal
          </button>
        </div>
      </div>
    )
  }

  const completed = goal.completed_count || 0
  const target = goal.target_count || 1
  const percent = Math.min(100, Math.round((completed / target) * 100))
  const isComplete = completed >= target

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-xl">&#127919;</div>
          <h2 className="text-base font-semibold text-gray-800">Meta Semanal</h2>
        </div>
        {isComplete && (
          <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium flex items-center gap-1">
            &#9989; Meta atingida!
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={isComplete ? '#10B981' : '#6366F1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - percent / 100)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-800">{percent}%</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800">
            {completed} <span className="text-sm font-normal text-gray-400">/ {target}</span>
          </p>
          <p className="text-sm text-gray-500">
            {isComplete
              ? 'Parabens! Voce atingiu sua meta.'
              : `Faltam ${target - completed} ${target - completed === 1 ? 'tarefa' : 'tarefas'} para atingir a meta`
            }
          </p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percent}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

WeeklyGoalCard.propTypes = {
  goal: goalShape,
  onCreateGoal: PropTypes.func.isRequired,
  isCreating: PropTypes.bool.isRequired,
}

function BadgeCard({ badge, earned, earnedAt }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div
      className={`rounded-2xl border p-4 text-center transition-all ${
        earned
          ? 'bg-white border-yellow-200 shadow-sm hover:shadow-md'
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      <div className="relative inline-block mb-2">
        <span className={`text-4xl ${earned ? '' : 'grayscale'}`}>
          {badge.icon || '&#127941;'}
        </span>
        {!earned && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>
      <h3 className={`text-sm font-semibold mb-0.5 ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
        {badge.name}
      </h3>
      <p className={`text-xs mb-1 ${earned ? 'text-gray-500' : 'text-gray-400'}`}>
        {badge.description}
      </p>
      {earned && earnedAt && (
        <p className="text-xs text-yellow-600 font-medium mt-1">
          &#11088; {formatDate(earnedAt)}
        </p>
      )}
    </div>
  )
}

BadgeCard.propTypes = {
  badge: badgeShape.isRequired,
  earned: PropTypes.bool.isRequired,
  earnedAt: PropTypes.string,
}

function ProfileSkeleton() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white/20" />
        <div className="flex-1 w-full">
          <div className="h-3 bg-white/20 rounded w-1/4 mb-3" />
          <div className="h-3 bg-white/20 rounded-full w-full mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 bg-white/10 rounded-xl" />
            <div className="h-20 bg-white/10 rounded-xl" />
            <div className="h-20 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Gamification() {
  const queryClient = useQueryClient()

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['game-profile'],
    queryFn: getGameProfile,
    staleTime: 1000 * 60,
  })

  const { data: userBadges, isLoading: userBadgesLoading } = useQuery({
    queryKey: ['user-badges'],
    queryFn: getUserBadges,
    staleTime: 1000 * 60 * 5,
  })

  const { data: allBadges, isLoading: allBadgesLoading } = useQuery({
    queryKey: ['all-badges'],
    queryFn: getAllBadges,
    staleTime: 1000 * 60 * 30,
  })

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ['weekly-goal'],
    queryFn: getCurrentGoal,
    staleTime: 1000 * 60,
    retry: false,
  })

  const goalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-goal'] })
    },
  })

  // Build sorted badge list: earned first, then unearned
  const earnedMap = new Map()
  if (userBadges) {
    userBadges.forEach((ub) => {
      earnedMap.set(ub.badge?.id, ub.earned_at)
    })
  }

  const badgesList = allBadges
    ? [...allBadges].sort((a, b) => {
        const aEarned = earnedMap.has(a.id)
        const bEarned = earnedMap.has(b.id)
        if (aEarned && !bEarned) return -1
        if (!aEarned && bEarned) return 1
        return 0
      })
    : []

  const badgesLoading = userBadgesLoading || allBadgesLoading

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <span className="text-xl">&#127918;</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gamificação</h1>
            <p className="text-sm text-gray-500">Acompanhe seu progresso e conquistas</p>
          </div>
        </div>

        {/* Error */}
        {profileError && (
          <div className="text-center py-16 text-red-500">
            Falha ao carregar perfil de gamificação.
          </div>
        )}

        {/* Profile Card */}
        {profileLoading && <ProfileSkeleton />}
        {!profileLoading && !profileError && profile && (
          <ProfileCard profile={profile} />
        )}

        {/* Weekly Goal */}
        <div className="mt-6">
          {goalLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-gray-100 rounded-full w-full" />
                </div>
              </div>
            </div>
          ) : (
            <WeeklyGoalCard
              goal={goal}
              onCreateGoal={(data) => goalMutation.mutate(data)}
              isCreating={goalMutation.isPending}
            />
          )}
        </div>

        {/* Badges Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">&#127941;</span>
            <h2 className="text-lg font-bold text-gray-800">Conquistas</h2>
            {userBadges && (
              <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                {userBadges.length} {userBadges.length === 1 ? 'conquistada' : 'conquistadas'}
              </span>
            )}
          </div>

          {badgesLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {!badgesLoading && badgesList.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">&#127941;</div>
              <p className="text-sm">Nenhuma conquista disponivel ainda</p>
            </div>
          )}

          {!badgesLoading && badgesList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badgesList.map((badge) => {
                const earned = earnedMap.has(badge.id)
                const earnedAt = earnedMap.get(badge.id)
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    earned={earned}
                    earnedAt={earnedAt}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
