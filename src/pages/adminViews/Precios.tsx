import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'
import PreciosCreateModal from '../../components/PreciosCreateModal'
import PreciosEditModal from '../../components/PreciosEditModal'

type PrecioRow = {
  id: number
  producto_id: string
  precio: string
}

export default function PreciosView() {
  const [rows, setRows] = useState<PrecioRow[]>([])
  const [products, setProducts] = useState<Array<{ id: string; nombre: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<PrecioRow | null>(null)

  async function loadRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('precios').select('id, producto_id, precio').order('id', { ascending: true })
      if (error) throw error
      setRows(Array.isArray(data) ? data as PrecioRow[] : [])
    } catch (err: any) {
      setError(err?.message || String(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    try {
      const { data } = await supabase.from('inventario').select('id, nombre').order('nombre', { ascending: true })
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    loadRows()
    loadProducts()
  }, [])

  const assignedProductIds = new Set(rows.map(r => String(r.producto_id)))
  const availableProductsForCreate = products.filter(p => !assignedProductIds.has(p.id))

  function openEdit(r: PrecioRow) {
    setEditRow(r)
    setEditOpen(true)
    setError(null)
  }

  async function handleCreate(payload: any) {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('precios').insert(payload)
      if (error) throw error

      // registrar en precios_historico
      try {
        const histPayload = { producto_id: payload.producto_id, precio: payload.precio }
        const { error: histErr } = await supabase.from('precios_historico').insert(histPayload)
        if (histErr) console.warn('No se pudo insertar en precios_historico', histErr)
      } catch (e) {
        console.warn('Error registrando precios_historico', e)
      }

      await loadRows()
    } catch (err: any) {
      setError(err?.message || String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(id: number, payload: any) {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('precios').update(payload).eq('id', id)
      if (error) throw error

      // determinar producto_id y precio a registrar en historico
      let productoId = payload.producto_id
      let precioVal = payload.precio
      if (!productoId || precioVal === undefined) {
        // buscar fila actualizada en DB
        try {
          const { data: updatedRows } = await supabase.from('precios').select('producto_id, precio').eq('id', id).limit(1).single()
          if (updatedRows) {
            productoId = productoId || updatedRows.producto_id
            precioVal = precioVal === undefined ? updatedRows.precio : precioVal
          }
        } catch (e) {
          // ignore
        }
      }

      try {
        if (productoId && precioVal !== undefined) {
          const histPayload = { producto_id: productoId, precio: precioVal }
          const { error: histErr } = await supabase.from('precios_historico').insert(histPayload)
          if (histErr) console.warn('No se pudo insertar en precios_historico', histErr)
        }
      } catch (e) {
        console.warn('Error registrando precios_historico', e)
      }

      await loadRows()
    } catch (err: any) {
      setError(err?.message || String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Precios de productos</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button className="btn-opaque" onClick={() => { loadRows(); loadProducts() }}>Recargar</button>
        <button className="btn-primary" onClick={() => setCreateOpen(true)} style={{ marginLeft: 6 }}>Agregar precio</button>
        <div style={{ marginLeft: 'auto', color: '#64748b' }}>{loading ? 'Cargando...' : `${rows.length} precios`}</div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
        <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'auto' }}>
          <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ width: 80 }}>{r.id}</td>
                <td style={{ minWidth: 220 }}>{products.find(p => p.id === r.producto_id)?.nombre || r.producto_id}</td>
                <td>{r.precio}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn-opaque" onClick={() => openEdit(r)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <PreciosCreateModal open={createOpen} onClose={() => setCreateOpen(false)} products={availableProductsForCreate} onCreate={async (payload) => { await handleCreate(payload); setCreateOpen(false) }} />
      <PreciosEditModal open={editOpen} onClose={() => { setEditOpen(false); setEditRow(null) }} row={editRow} products={products} availableProducts={[...products.filter(p => !assignedProductIds.has(p.id)), ...(editRow ? products.filter(p => p.id === editRow.producto_id) : [])]} onSave={async (id, payload) => { await handleUpdate(id, payload); setEditOpen(false); setEditRow(null) }} />
    </div>
  )
}
