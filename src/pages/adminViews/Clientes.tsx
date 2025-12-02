import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'
import CreateClienteModal from '../../components/CreateClienteModal'
import Confirmado from '../../components/Confirmado'

type ClienteRow = {
  id: number | string
  nombre: string
  rtn?: string
  telefono?: string
  correo_electronico?: string
  tipo_cliente?: string
  exonerado?: boolean
}

export default function Clientes() {
  const [rows, setRows] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [clienteRTN, setClienteRTN] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteCorreo, setClienteCorreo] = useState('')
  const [clienteExonerado, setClienteExonerado] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ClienteRow | null>(null)

  async function loadRows(q?: string) {
    setLoading(true)
    setError(null)
    try {
      let res
      if (q && q.trim()) {
        const term = q.trim()
        const pattern = `%${term}%`
        res = await supabase.from('clientes')
          .select('id,nombre,rtn,telefono,correo_electronico,tipo_cliente,exonerado')
          .or(`nombre.ilike.${pattern},rtn.ilike.${pattern}`)
          .order('id', { ascending: false })
      } else {
        res = await supabase.from('clientes').select('id,nombre,rtn,telefono,correo_electronico,tipo_cliente,exonerado').order('id', { ascending: false }).limit(500)
      }
      if (res.error) throw res.error
      setRows(Array.isArray(res.data) ? res.data as ClienteRow[] : [])
    } catch (err: any) {
      setError(err?.message || String(err))
      setRows([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadRows() }, [])

  useEffect(() => {
    const t = setTimeout(() => loadRows(search), 300)
    return () => clearTimeout(t)
  }, [search])

  function openCreate() {
    setEditingId(null)
    setClienteRTN('')
    setClienteNombre('')
    setClienteTelefono('')
    setClienteCorreo('')
    setClienteExonerado(false)
    setCreateOpen(true)
  }

  async function handleCreateOrUpdate() {
    setLoading(true)
    setError(null)
    try {
      const payload: any = {
        nombre: String(clienteNombre || '').trim(),
        rtn: clienteRTN || null,
        telefono: clienteTelefono || null,
        correo_electronico: clienteCorreo || null,
        // do not force tipo_cliente here to avoid violating DB check constraints;
        // let DB default or existing value remain unless user explicitly edits it
        exonerado: clienteExonerado || false,
      }
      if (!payload.nombre) throw new Error('El campo nombre es requerido')

      if (editingId == null) {
        // create: check duplicate rtn
        if (payload.rtn) {
          const { data: existing, error: existErr } = await supabase.from('clientes').select('id').eq('rtn', payload.rtn).limit(1)
          if (existErr) throw existErr
          if (Array.isArray(existing) && existing.length > 0) throw new Error(`Ya existe un cliente con RTN ${payload.rtn}`)
        }
        const { error } = await supabase.from('clientes').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').update(payload).eq('id', editingId)
        if (error) throw error
      }
      setCreateOpen(false)
      await loadRows()
    } catch (err: any) {
      setError(err?.message || String(err))
      throw err
    } finally { setLoading(false) }
  }

  function startEdit(row: ClienteRow) {
    setEditingId(row.id)
    setClienteRTN(row.rtn || '')
    setClienteNombre(row.nombre || '')
    setClienteTelefono(row.telefono || '')
    setClienteCorreo(row.correo_electronico || '')
    setClienteExonerado(Boolean(row.exonerado))
    setCreateOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', toDelete.id)
      if (error) throw error
      setConfirmOpen(false)
      setToDelete(null)
      await loadRows()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Clientes (clientes)</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button className="btn-opaque" onClick={() => loadRows()}>Recargar</button>
        <button className="btn-primary" onClick={openCreate}>Agregar cliente</button>
        <div style={{ marginLeft: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" placeholder="Buscar por nombre o RTN..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
          <button className="btn-opaque" onClick={() => { setSearch(''); loadRows() }}>Limpiar</button>
        </div>
        <div style={{ marginLeft: 'auto', color: '#64748b' }}>{loading ? 'Cargando...' : `${rows.length} clientes`}</div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>RTN</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Tipo</th>
              <th>Exonerado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={String(r.id)}>
                <td>{r.rtn || ''}</td>
                <td style={{ minWidth: 180 }}>{r.nombre}</td>
                <td>{r.telefono || ''}</td>
                <td>{r.correo_electronico || ''}</td>
                <td>{r.tipo_cliente || ''}</td>
                <td>{r.exonerado ? 'Sí' : 'No'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn-opaque" onClick={() => startEdit(r)}>Editar</button>
                  <button className="btn-danger" onClick={() => { setToDelete(r); setConfirmOpen(true) }} style={{ marginLeft: 8 }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateClienteModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditingId(null) }}
        clienteRTN={clienteRTN}
        clienteNombre={clienteNombre}
        clienteTelefono={clienteTelefono}
        clienteCorreo={clienteCorreo}
        clienteExonerado={clienteExonerado}
        onChangeRTN={v => setClienteRTN(v)}
        onChangeNombre={v => setClienteNombre(v)}
        onChangeTelefono={v => setClienteTelefono(v)}
        onChangeCorreo={v => setClienteCorreo(v)}
        onChangeExonerado={v => setClienteExonerado(v)}
        onCreate={async () => { await handleCreateOrUpdate() }}
      />

      <Confirmado
        open={confirmOpen}
        title={toDelete ? `Eliminar cliente ${toDelete.nombre}` : 'Eliminar cliente'}
        message={toDelete ? `¿Confirma eliminar al cliente ${toDelete.nombre}? Esta acción es irreversible.` : '¿Confirma eliminar el cliente?'}
        onClose={async () => { await handleDeleteConfirm() }}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
        confirmLabel="Eliminar"
        cancelLabel="Cerrar"
      />
    </div>
  )
}
