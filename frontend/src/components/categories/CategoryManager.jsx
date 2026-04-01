import PropTypes from 'prop-types'
import { useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '../../services/categories'

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

export default function CategoryManager({ categories, onClose, onUpdate }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    setLoading(true)
    try {
      await createCategory({ name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor('#3B82F6')
      onUpdate()
    } catch (err) {
      const data = err.response?.data
      setError(data?.name?.[0] || data?.detail || 'Falha ao criar categoria.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id)
      onUpdate()
    } catch {
      setError('Falha ao excluir categoria.')
    }
  }

  const startEdit = (cat) => {
    setEditId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, { name: editName, color: editColor })
      setEditId(null)
      onUpdate()
    } catch {
      setError('Falha ao atualizar categoria.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Categorias</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          Fechar
        </button>
      </div>

      <form onSubmit={handleCreate} className="mb-4">
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da categoria"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                newColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="w-full py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
        >
          Adicionar Categoria
        </button>
      </form>

      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma categoria ainda.</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
            {editId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-4 h-4 rounded-full border ${
                        editColor === c ? 'border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={() => handleUpdate(cat.id)} className="text-xs text-green-600 hover:underline">
                  Salvar
                </button>
                <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:underline">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                <button onClick={() => startEdit(cat)} className="text-xs text-gray-400 hover:text-indigo-600">
                  Editar
                </button>
                <button onClick={() => handleDelete(cat.id)} className="text-xs text-gray-400 hover:text-red-600">
                  Excluir
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

CategoryManager.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}
