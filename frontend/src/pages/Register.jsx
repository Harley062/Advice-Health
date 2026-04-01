import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BRAND } from '../constants/brand'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.password2)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
      } else {
        setErrors({ non_field_errors: ['Falha no cadastro. Tente novamente.'] })
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (field) =>
    errors[field] ? (
      <p className="text-red-600 text-sm mt-1">{errors[field][0]}</p>
    ) : null

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
        <p className="text-center text-slate-500 mb-8">Crie sua conta e comece hoje</p>

        {errors.non_field_errors && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errors.non_field_errors[0]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="username">
              Nome de usu&aacute;rio
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="joaosilva"
            />
            {fieldError('username')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reg-email">
              E-mail
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="voce@exemplo.com"
            />
            {fieldError('email')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reg-password">
              Senha
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Min. 8 caracteres"
            />
            {fieldError('password')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password2">
              Confirmar Senha
            </label>
            <input
              id="password2"
              name="password2"
              type="password"
              value={form.password2}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
            {fieldError('password2')}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 disabled:brightness-95 text-white font-semibold py-2.5 rounded-xl transition-all mt-2"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6">
          J&aacute; tem uma conta?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
