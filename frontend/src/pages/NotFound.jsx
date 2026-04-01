import { Link } from 'react-router-dom'
import { BRAND } from '../constants/brand'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="text-center bg-white/90 border border-white p-10 rounded-3xl shadow-xl">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold shadow-md mb-3">
          {BRAND.shortName}
        </span>
        <h1 className="text-6xl font-extrabold text-indigo-600 mb-2">404</h1>
        <p className="text-xl text-slate-700 mb-2">Ops! Essa rota se perdeu no caminho.</p>
        <p className="text-sm text-slate-500 mb-8">{BRAND.name} · {BRAND.welcome}</p>
        <Link
          to="/"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:brightness-110 transition-all font-medium"
        >
          Voltar para o painel
        </Link>
      </div>
    </div>
  )
}
