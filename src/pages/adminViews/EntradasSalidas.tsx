import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'

type Registro = {
  id: number | string
  producto_id: string
  cantidad: number
  tipo_de_movimiento: string
  referencia?: string
  usuario?: string
  fecha_salida?: string
}

type Producto = { id: string; nombre?: string; sku?: string; marca?: string; categoria?: string }

export default function EntradasSalidas() {
  const [sku, setSku] = useState('')
  const [marca, setMarca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [marcasOptions, setMarcasOptions] = useState<string[]>([])
  const [categoriasOptions, setCategoriasOptions] = useState<string[]>([])
  const [last24h, setLast24h] = useState(false)

  const [registros, setRegistros] = useState<Registro[]>([])
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadRegistros() {
    setLoading(true)
    setError(null)
    setRegistros([])
    try {
      // If sku/marca/categoria filters provided, resolve matching product ids first
      let productIds: string[] | null = null
      if (sku || marca || categoria) {
        let q: any = supabase.from('inventario').select('id').order('nombre', { ascending: true })
        if (sku) q = q.ilike('sku', `%${sku}%`)
        if (marca) q = q.ilike('marca', `%${marca}%`)
        if (categoria) q = q.ilike('categoria', `%${categoria}%`)
        const { data: prodData, error: prodErr } = await q
        if (prodErr) throw prodErr
        productIds = Array.isArray(prodData) ? prodData.map((p: any) => String(p.id)) : []
        if (productIds.length === 0) {
          setRegistros([])
          setProductosMap({})
          setLoading(false)
          return
        }
      }

      // Query registro_de_inventario with optional product id filter and date filter
      let q2: any = supabase.from('registro_de_inventario').select('id, producto_id, cantidad, tipo_de_movimiento, referencia, usuario, fecha_salida')
      if (productIds) q2 = q2.in('producto_id', productIds)
      if (last24h) {
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        q2 = q2.gte('fecha_salida', cutoff)
      }
      q2 = q2.order('fecha_salida', { ascending: false })
      const { data: regData, error: regErr } = await q2
      if (regErr) throw regErr
      const rows: Registro[] = Array.isArray(regData) ? regData.map((r: any) => ({
        id: r.id,
        producto_id: String(r.producto_id),
        cantidad: Number(r.cantidad),
        tipo_de_movimiento: r.tipo_de_movimiento,
        referencia: r.referencia,
        usuario: r.usuario,
        fecha_salida: r.fecha_salida
      })) : []
      setRegistros(rows)

      // Load product details for involved product ids
      const ids = Array.from(new Set(rows.map(r => r.producto_id))).filter(Boolean)
      if (ids.length > 0) {
        const { data: prodData2 } = await supabase.from('inventario').select('id, nombre, sku, marca, categoria').in('id', ids)
        const map: Record<string, Producto> = {}
        if (Array.isArray(prodData2)) prodData2.forEach((p: any) => { map[String(p.id)] = { id: p.id, nombre: p.nombre, sku: p.sku, marca: p.marca, categoria: p.categoria } })
        setProductosMap(map)
      } else {
        setProductosMap({})
      }
    } catch (err: any) {
      setError(err?.message || String(err))
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }

  async function loadFiltersOptions() {
    try {
      // Load marcas and categorias from inventario, deduplicate client-side
      const { data: invData, error: invErr } = await supabase.from('inventario').select('marca, categoria')
      if (invErr) throw invErr
      const marcasSet = new Set<string>()
      const categoriasSet = new Set<string>()
      if (Array.isArray(invData)) {
        invData.forEach((r: any) => {
          if (r.marca) marcasSet.add(String(r.marca))
          if (r.categoria) categoriasSet.add(String(r.categoria))
        })
      }
      setMarcasOptions(Array.from(marcasSet).sort())
      setCategoriasOptions(Array.from(categoriasSet).sort())
    } catch (err) {
      // ignore filter load errors silently
      console.warn('Error loading filter options', err)
    }
  }

  useEffect(() => { loadRegistros(); loadFiltersOptions() }, [])

  // Split into entradas and salidas
  const entradas = registros.filter(r => String(r.tipo_de_movimiento).toUpperCase() === 'ENTRADA')
  const salidas = registros.filter(r => String(r.tipo_de_movimiento).toUpperCase() === 'SALIDA')

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Movimiento de Inventario</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input className="input" placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
        <select className="input" value={marca} onChange={e => setMarca(e.target.value)}>
          <option value="">-- Marca (todas) --</option>
          {marcasOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input" value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="">-- Categoría (todas) --</option>
          {categoriasOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={last24h} onChange={e => setLast24h(e.target.checked)} /> Últimas 24h
        </label>
        <button className="btn-opaque" onClick={() => loadRegistros()}>Aplicar</button>
        <button className="btn-opaque" onClick={() => { setSku(''); setMarca(''); setCategoria(''); setLast24h(false); loadRegistros() }}>Limpiar</button>
        <div style={{ marginLeft: 'auto', color: '#64748b' }}>{loading ? 'Cargando...' : `${registros.length} registros`}</div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Entradas</strong>
            <button className="btn-opaque" onClick={() => { document.body.classList.add('print-table-only'); setTimeout(() => { window.print(); document.body.classList.remove('print-table-only') }, 50) }}>Imprimir</button>
          </div>
          <table className="admin-table" style={{ marginTop: 8 }}>
            <thead>
              <tr><th>ID</th><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Referencia</th><th>Usuario</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {entradas.map(r => (
                <tr key={String(r.id)}>
                  <td style={{ width: 70 }}>{String(r.id)}</td>
                  <td style={{ minWidth: 120 }}>{productosMap[r.producto_id]?.sku || r.producto_id}</td>
                  <td>{productosMap[r.producto_id]?.nombre || ''}</td>
                  <td style={{ textAlign: 'right' }}>{Number(r.cantidad).toFixed(2)}</td>
                  <td>{r.referencia || ''}</td>
                  <td>{r.usuario || ''}</td>
                  <td>{r.fecha_salida || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Salidas</strong>
            <button className="btn-opaque" onClick={() => { document.body.classList.add('print-table-only'); setTimeout(() => { window.print(); document.body.classList.remove('print-table-only') }, 50) }}>Imprimir</button>
          </div>
          <table className="admin-table" style={{ marginTop: 8 }}>
            <thead>
              <tr><th>ID</th><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Referencia</th><th>Usuario</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {salidas.map(r => (
                <tr key={String(r.id)}>
                  <td style={{ width: 70 }}>{String(r.id)}</td>
                  <td style={{ minWidth: 120 }}>{productosMap[r.producto_id]?.sku || r.producto_id}</td>
                  <td>{productosMap[r.producto_id]?.nombre || ''}</td>
                  <td style={{ textAlign: 'right' }}>{Number(r.cantidad).toFixed(2)}</td>
                  <td>{r.referencia || ''}</td>
                  <td>{r.usuario || ''}</td>
                  <td>{r.fecha_salida || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
