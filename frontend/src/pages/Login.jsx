import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BRAND } from '../constants/brand'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Falha no login. Verifique suas credenciais.'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="bg-white/95 p-8 rounded-3xl shadow-2xl border border-white/80 w-full max-w-md backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold shadow-md">
            {BRAND.shortName}
          </span>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {BRAND.name}
          </h1>
        </div>
        <p className="text-center text-slate-500 mb-8">{BRAND.welcome} · Entre na sua conta</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 disabled:brightness-95 text-white font-semibold py-2.5 rounded-xl transition-all"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6">
          Ainda n&atilde;o tem uma conta?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
