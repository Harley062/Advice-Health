import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (path, label) => {
    const active = location.pathname === path
    return (
      <button
        onClick={() => navigate(path)}
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? 'bg-indigo-50 text-indigo-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-indigo-600">To-Do App</span>
          <div className="flex items-center gap-1">
            {navLink('/', 'Tarefas')}
            {navLink('/insights', 'Insights')}
          </div>
        </div>
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </nav>
  )
}
