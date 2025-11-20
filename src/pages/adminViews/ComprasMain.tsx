import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'
import CompraCreateModal from '../../components/CompraCreateModal'
import CompraDetailModal from '../../components/CompraDetailModal'

type Proveedor = { id: number | string; nombre: string }

type CompraRow = {
  id: number | string
  proveedor_id: number | string
  numero_documento?: string
  fecha_compra?: string
  subtotal?: string
  impuesto?: string
  total?: string
}

export default function ComprasMain() {
  const [rows, setRows] = useState<CompraRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCompraId, setSelectedCompraId] = useState<number | string | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filterProveedor, setFilterProveedor] = useState<string | ''>('')
  const [filterDocumento, setFilterDocumento] = useState<string>('')
  const [filterLast24h, setFilterLast24h] = useState<boolean>(false)

  async function loadRows() {
    setLoading(true)
    setError(null)
    try {
      let query: any = supabase.from('compras').select('id, proveedor_id, numero_documento, fecha_compra, subtotal, impuesto, total')
      if (filterProveedor) {
        // proveedor id stored as number in DB; try numeric compare but keep string handling
        const num = Number(filterProveedor)
        if (!isNaN(num)) query = query.eq('proveedor_id', num)
        else query = query.eq('proveedor_id', filterProveedor)
      }
      if (filterDocumento) {
        query = query.ilike('numero_documento', `%${filterDocumento}%`)
      }
      if (filterLast24h) {
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        query = query.gte('fecha_compra', cutoff)
      }
      const { data, error } = await query.order('id', { ascending: false })
      if (error) throw error
      setRows(Array.isArray(data) ? data as CompraRow[] : [])
    } catch (err: any) {
      setError(err?.message || String(err))
      setRows([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadRows() }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.from('proveedores').select('id, nombre').order('nombre', { ascending: true })
        if (!mounted) return
        setProveedores(Array.isArray(data) ? data as Proveedor[] : [])
      } catch (err) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Compras (compras)</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="input" value={filterProveedor} onChange={e => setFilterProveedor(e.target.value)}>
            <option value="">-- proveedor (todos) --</option>
            {proveedores.map(p => <option key={String(p.id)} value={String(p.id)}>{p.nombre}</option>)}
          </select>
          <input className="input" placeholder="Número documento" value={filterDocumento} onChange={e => setFilterDocumento(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={filterLast24h} onChange={e => setFilterLast24h(e.target.checked)} /> Últimas 24h
          </label>
          <button className="btn-opaque" onClick={() => loadRows()}>Aplicar</button>
          <button className="btn-opaque" onClick={() => { setFilterProveedor(''); setFilterDocumento(''); setFilterLast24h(false); loadRows() }}>Limpiar</button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-opaque" onClick={() => loadRows()}>Recargar</button>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>Nueva compra</button>
          <div style={{ marginLeft: 12, color: '#64748b' }}>{loading ? 'Cargando...' : `${rows.length} compras`}</div>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Proveedor</th>
              <th>Documento</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>Impuesto</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={String(r.id)}>
                <td style={{ width: 80 }}>{String(r.id)}</td>
                <td>{String(r.proveedor_id)}</td>
                <td>{r.numero_documento || ''}</td>
                <td>{r.fecha_compra || ''}</td>
                <td>{r.subtotal || ''}</td>
                <td>{r.impuesto || ''}</td>
                <td>{r.total || ''}</td>
                <td>
                  <button className="btn-opaque" onClick={() => { setSelectedCompraId(r.id); setDetailOpen(true) }}>Detalle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CompraCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); loadRows() }} />
      <CompraDetailModal open={detailOpen} compraId={selectedCompraId} onClose={() => { setDetailOpen(false); setSelectedCompraId(null) }} />
    </div>
  )
}
