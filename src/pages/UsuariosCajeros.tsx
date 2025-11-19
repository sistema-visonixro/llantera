import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function UsuariosCajeros() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [createUsername, setCreateUsername] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('users').select('id, username, role').limit(1000)
      if (error) throw error
      setUsers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || String(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function createUser() {
    if (!createUsername) return setError('Ingrese un nombre de usuario para crear')
    if (!createPassword) return setError('Ingrese una contraseña para crear')
    setLoading(true)
    setError(null)
    try {
      const payload = { username: createUsername, password: createPassword, role: 'cajero' }
      const { error } = await supabase.from('users').insert(payload)
      if (error) throw error
      setCreateUsername('')
      setCreatePassword('')
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  function startEdit(u: any) {
    setEditId(u.id)
    setEditUsername(u.username || '')
    setEditPassword('')
    setError(null)
  }

  function cancelEdit() {
    setEditId(null)
    setEditUsername('')
    setEditPassword('')
    setError(null)
  }

  async function saveEdit() {
    if (editId == null) return
    if (!editUsername) return setError('El nombre de usuario no puede estar vacío')
    setLoading(true)
    setError(null)
    try {
      const payload: any = { username: editUsername }
      if (editPassword) payload.password = editPassword
      const { error } = await supabase.from('users').update(payload).eq('id', editId)
      if (error) throw error
      cancelEdit()
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function deleteUser(id: number, role: string) {
    if (role !== 'cajero') return setError('Solo se pueden eliminar usuarios con role "cajero"')
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!mounted) return
      await loadUsers()
    })()
    return () => { mounted = false }
  }, [])

  const filtered = users.filter(u => {
    if (!search) return true
    const s = search.toLowerCase()
    return (u.username || '').toLowerCase().includes(s) || (String(u.id) || '').includes(s) || (u.role || '').toLowerCase().includes(s)
  })

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Usuarios Cajeros</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar usuario o rol..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <button onClick={() => loadUsers()} className="btn-opaque">Recargar</button>
        <div style={{ marginLeft: 'auto', color: '#64748b' }}>{loading ? 'Cargando...' : `${filtered.length} usuarios`}</div>

        <div style={{ width: '100%', height: 8 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Nuevo usuario" className="input" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} />
          <input placeholder="Contraseña" className="input" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
          <button onClick={() => createUser()} className="btn-primary">Crear (role: cajero)</button>
        </div>
      </div>

      {error ? (
        <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ width: 80 }}>{u.id}</td>
                  <td style={{ minWidth: 180 }}>
                    {editId === u.id ? (
                      <input className="input" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                    ) : (
                      u.username || '-'
                    )}
                  </td>
                  <td style={{ width: 220 }}>
                    {editId === u.id ? (
                      <input className="input" placeholder="Nueva contraseña (opcional)" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                    ) : (
                      u.role || '-'
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {editId === u.id ? (
                      <>
                        <button onClick={() => saveEdit()} className="btn-primary" style={{ marginRight: 6 }}>Guardar</button>
                        <button onClick={() => cancelEdit()} className="btn-opaque">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)} className="btn-opaque" style={{ marginRight: 6 }}>Editar</button>
                        {u.role === 'cajero' ? (
                          <button onClick={() => deleteUser(u.id, u.role)} className="btn-danger">Eliminar</button>
                        ) : (
                          <button className="btn-opaque" disabled title="No se puede eliminar usuarios admin">Eliminar</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && <div style={{ padding: 12 }}>No se encontraron usuarios.</div>}
        </div>
      )}
    </div>
  )
}
