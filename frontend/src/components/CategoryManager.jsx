import { useState } from 'react'
import api from '../services/api'

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
      await api.post('/categories/', { name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor('#3B82F6')
      onUpdate()
    } catch (err) {
      const data = err.response?.data
      setError(data?.name?.[0] || data?.detail || 'Failed to create category.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}/`)
      onUpdate()
    } catch {
      // ignore
    }
  }

  const startEdit = (cat) => {
    setEditId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const handleUpdate = async (id) => {
    try {
      await api.patch(`/categories/${id}/`, { name: editName, color: editColor })
      setEditId(null)
      onUpdate()
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Categories</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          Close
        </button>
      </div>

      <form onSubmit={handleCreate} className="mb-4">
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name"
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
          Add Category
        </button>
      </form>

      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No categories yet.</p>
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
                <button
                  onClick={() => handleUpdate(cat.id)}
                  className="text-xs text-green-600 hover:underline"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                <button
                  onClick={() => startEdit(cat)}
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Del
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
