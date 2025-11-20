import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'
import ProveedorCreateModal from '../../components/ProveedorCreateModal'
import ProveedorEditModal from '../../components/ProveedorEditModal'
import Confirmado from '../../components/Confirmado'

type ProveedorRow = {
  id: number | string
  nombre: string
  rtn?: string
  telefono?: string
  correo?: string
  direccion?: string
  tipo_proveedor?: string
  activo?: boolean
}

export default function Proveedores() {
  const [rows, setRows] = useState<ProveedorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<ProveedorRow | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ProveedorRow | null>(null)

  async function loadRows(q?: string) {
    setLoading(true)
    setError(null)
    try {
      let data: any = null
      let error: any = null
      if (q && q.trim()) {
        const term = q.trim()
        const pattern = `%${term}%`
        const res = await supabase.from('proveedores')
          .select('id, nombre, rtn, telefono, correo, direccion, tipo_proveedor, activo')
          .or(`nombre.ilike.${pattern},rtn.ilike.${pattern}`)
          .order('id', { ascending: true })
        data = res.data
        error = res.error
      } else {
        const res = await supabase.from('proveedores').select('id, nombre, rtn, telefono, correo, direccion, tipo_proveedor, activo').order('id', { ascending: true })
        data = res.data
        error = res.error
      }
      if (error) throw error
      setRows(Array.isArray(data) ? data as ProveedorRow[] : [])
    } catch (err: any) {
      setError(err?.message || String(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRows() }, [])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      loadRows(search)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleCreate(payload: any) {
    setLoading(true)
    setError(null)
    try {
      const payloadToInsert = { ...payload }
      // Ensure frontend does not send `id`; let Supabase (Postgres) generate it
      delete (payloadToInsert as any).id
      // Prevent duplicate by RTN if provided
      if (payloadToInsert.rtn) {
        const { data: existing, error: existErr } = await supabase.from('proveedores').select('id, nombre').eq('rtn', payloadToInsert.rtn).limit(1)
        if (existErr) throw existErr
        if (Array.isArray(existing) && existing.length > 0) {
          throw new Error(`Ya existe un proveedor con RTN ${payloadToInsert.rtn}`)
        }
      }
      const { error } = await supabase.from('proveedores').insert(payloadToInsert)
      if (error) throw error
      await loadRows()
    } catch (err: any) {
      // Provide clearer message for duplicate-key (sequence desalineada)
      if (String(err).includes('Ya existe un proveedor')) {
        setError(String(err))
      } else if (err?.code === '23505' || String(err).includes('duplicate key value')) {
        setError('Clave duplicada: el id ya existe. Ejecuta la reparación de la sequence en la BD (setval) o contacta al administrador.')
      } else {
        setError(err?.message || String(err))
      }
      throw err
    } finally { setLoading(false) }
  }

  async function handleUpdate(id: number | string, payload: any) {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('proveedores').update(payload).eq('id', id)
      if (error) throw error
      await loadRows()
    } catch (err: any) {
      setError(err?.message || String(err))
      throw err
    } finally { setLoading(false) }
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', toDelete.id)
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
      <h2 style={{ marginTop: 0 }}>Proveedores (proveedores)</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button className="btn-opaque" onClick={() => loadRows()}>Recargar</button>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>Agregar proveedor</button>
        <div style={{ marginLeft: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Buscar por nombre o RTN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <button className="btn-opaque" onClick={() => { setSearch(''); loadRows() }}>Limpiar</button>
        </div>
        <div style={{ marginLeft: 'auto', color: '#64748b' }}>{loading ? 'Cargando...' : `${rows.length} proveedores`}</div>
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
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
            <td>{r.rtn || ''}</td>
                <td style={{ minWidth: 180 }}>{r.nombre}</td>
                
                <td>{r.telefono || ''}</td>
                <td>{r.correo || ''}</td>
                <td>{r.direccion || ''}</td>
                <td>{r.tipo_proveedor || ''}</td>
                <td>{r.activo ? 'Sí' : 'No'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn-opaque" onClick={() => { setEditRow(r); setEditOpen(true) }}>Editar</button>
                  <button className="btn-danger" onClick={() => { setToDelete(r); setConfirmOpen(true) }} style={{ marginLeft: 8 }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProveedorCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={async (payload) => { await handleCreate(payload); setCreateOpen(false) }} />
      <ProveedorEditModal open={editOpen} onClose={() => { setEditOpen(false); setEditRow(null) }} row={editRow} onSave={async (id, payload) => { await handleUpdate(id, payload); setEditOpen(false); setEditRow(null) }} />

      <Confirmado
        open={confirmOpen}
        title={toDelete ? `Eliminar proveedor ${toDelete.nombre}` : 'Eliminar proveedor'}
        message={toDelete ? `¿Confirma eliminar al proveedor ${toDelete.nombre}? Esta acción es irreversible.` : '¿Confirma eliminar el proveedor?'}
        onClose={async () => {
          // Cuando el usuario confirma (Aceptar), ejecutamos la eliminación
          await handleDeleteConfirm()
        }}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
        confirmLabel="Eliminar"
        cancelLabel="Cerrar"
      />
    </div>
  )
}
