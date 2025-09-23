import { useMatters, useCreateMatter, useUpdateMatter, useDeleteMatter } from '../hooks/reactQueryHooks'
import { useState } from 'react'

export default function MattersPage() {
  const { data: matters, isLoading } = useMatters()
  const createMatter = useCreateMatter()
  const updateMatter = useUpdateMatter()
  const deleteMatter = useDeleteMatter()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  if (isLoading) return <div>Loading...</div>

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Matters</h2>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!newName) return
          createMatter.mutate({ name: newName, color: newColor })
          setNewName('')
          setNewColor('')
        }}
        style={{ marginBottom: 24 }}
      >
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Matter name"
          required
        />
        <input
          value={newColor}
          onChange={e => setNewColor(e.target.value)}
          placeholder="Color (optional)"
        />
        <button type="submit">Add Matter</button>
      </form>
      <ul>
        {matters?.map(m => (
          <li key={m.id} style={{ marginBottom: 8 }}>
            {editId === m.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  updateMatter.mutate({ id: m.id, patch: { name: editName, color: editColor } })
                  setEditId(null)
                }}
                style={{ display: 'inline' }}
              >
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
                <input
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>{m.name}</span>
                {m.color && <span style={{ color: m.color, marginRight: 8 }}>●</span>}
                <button onClick={() => {
                  setEditId(m.id)
                  setEditName(m.name)
                  setEditColor(m.color || '')
                }}>Edit</button>
                <button onClick={() => deleteMatter.mutate(m.id)} style={{ marginLeft: 4 }}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
