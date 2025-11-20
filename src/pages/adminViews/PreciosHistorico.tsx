import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'

type InventarioRow = { id: string; nombre: string; sku?: string }
type HistoricoRow = { id: number | string; producto_id: string; precio: string; cambiado_en: string }

export default function PreciosHistorico() {
  const [sku, setSku] = useState('')
  const [products, setProducts] = useState<InventarioRow[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<HistoricoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function searchBySku() {
    setError(null)
    setProducts([])
    setSelectedProductId(null)
    setHistorico([])
    if (!sku) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('inventario').select('id, nombre, sku').ilike('sku', `%${sku}%`).order('nombre', { ascending: true })
      if (error) throw error
      setProducts(Array.isArray(data) ? data as InventarioRow[] : [])
      if (Array.isArray(data) && data.length === 1) {
        const id = (data[0] as any).id
        setSelectedProductId(id)
        await loadHistorico(id)
      }
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function loadHistorico(productId: string) {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('precios_historico').select('id, producto_id, precio, cambiado_en').eq('producto_id', productId).order('cambiado_en', { ascending: false })
      if (error) throw error
      setHistorico(Array.isArray(data) ? data as HistoricoRow[] : [])
    } catch (err: any) {
      setError(err?.message || String(err))
      setHistorico([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProductId) loadHistorico(selectedProductId)
  }, [selectedProductId])

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Histórico de precios</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input className="input" placeholder="Buscar por SKU" value={sku} onChange={e => setSku(e.target.value)} />
        <button className="btn-opaque" onClick={() => searchBySku()}>Buscar</button>
        <button className="btn-opaque" onClick={() => { setSku(''); setProducts([]); setSelectedProductId(null); setHistorico([]) }}>Limpiar</button>
        <div style={{ marginLeft: 'auto', color: '#64748b' }}>{loading ? 'Cargando...' : `${historico.length} registros`}</div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {products.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Resultados:</div>
          <ul>
            {products.map(p => (
              <li key={p.id} style={{ marginBottom: 6 }}>
                <button className="btn-opaque" onClick={() => setSelectedProductId(p.id)} style={{ marginRight: 8 }}>{p.sku}</button>
                <strong>{p.nombre}</strong> <span style={{ color: '#6b7280' }}>({p.id})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div>
          <div>
            <button className="btn-opaque" onClick={() => {
              document.body.classList.add('print-table-only')
              setTimeout(() => { window.print(); document.body.classList.remove('print-table-only') }, 50)
            }}>Imprimir tabla</button>
          </div>
        </div>

        <table className="admin-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Actualizacion</th>
            </tr>
          </thead>
          <tbody>
            {historico.map(h => (
              <tr key={String(h.id)}>
                <td style={{ width: 80 }}>{String(h.id)}</td>
                <td style={{ minWidth: 220 }}>{products.find(p => p.id === h.producto_id)?.nombre || h.producto_id}</td>
                <td>{Number(h.precio).toFixed(2)}</td>
                <td>{h.cambiado_en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
