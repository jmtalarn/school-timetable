import { useKids, useCreateKid, useUpdateKid, useDeleteKid } from '../hooks/reactQueryHooks'
import { useState } from 'react'

export default function KidsPage() {
  const { data: kids, isLoading } = useKids()
  const createKid = useCreateKid()
  const updateKid = useUpdateKid()
  const deleteKid = useDeleteKid()

  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  if (isLoading) return <div>Loading...</div>

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Kids</h2>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!newName) return
          createKid.mutate({ name: newName })
          setNewName('')
        }}
        style={{ marginBottom: 24 }}
      >
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Kid name"
          required
        />
        <button type="submit">Add Kid</button>
      </form>
      <ul>
        {kids?.map(k => (
          <li key={k.id} style={{ marginBottom: 8 }}>
            {editId === k.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  updateKid.mutate({ id: k.id, patch: { name: editName } })
                  setEditId(null)
                }}
                style={{ display: 'inline' }}
              >
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>{k.name}</span>
                <button onClick={() => {
                  setEditId(k.id)
                  setEditName(k.name)
                }}>Edit</button>
                <button onClick={() => deleteKid.mutate(k.id)} style={{ marginLeft: 4 }}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
