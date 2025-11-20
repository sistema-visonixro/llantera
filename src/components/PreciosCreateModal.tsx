import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

type Props = {
  open: boolean
  onClose: () => void
  products: Array<{ id: string; nombre: string }>
  availableCajas?: number[]
  onCreate: (payload: { producto_id: string; precio: string }) => Promise<void>
}

export default function PreciosCreateModal({ open, onClose, products, availableCajas, onCreate }: Props) {
  const [productoId, setProductoId] = useState<string | null>(null)
  const [precio, setPrecio] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costo, setCosto] = useState<number | null>(null)
  const [impuestoValor, setImpuestoValor] = useState<number | null>(null)
  const [impuestoMonto, setImpuestoMonto] = useState<number | null>(null)
  const [margenPct, setMargenPct] = useState<number | null>(null)
  const [rentabilidadPct, setRentabilidadPct] = useState<number | null>(null)
  const [calculando, setCalculando] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return
    setProductoId(null)
    setPrecio('')
    setCosto(null)
    setImpuestoValor(null)
    setImpuestoMonto(null)
    setMargenPct(null)
    setRentabilidadPct(null)
    setError(null)
  }, [open])


  async function handleCreate() {
    const missing: string[] = []
    if (!productoId) missing.push('Producto')
    if (!precio) missing.push('Precio')
    if (missing.length > 0) {
      setError(`Faltan campos: ${missing.join(', ')}`)
      return
    }
    const n = Number(precio)
    if (isNaN(n) || n < 0) { setError('Precio inválido'); return }

    setSaving(true)
    setError(null)
    try {
      // productoId is non-null here due to validation above
      await onCreate({ producto_id: productoId as string, precio: precio })
      onClose()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  // Helper to parse number from string inputs
  function parseNumberInput(v: string) {
    if (!v) return NaN
    return Number(v.replace(',', '.'))
  }

  // Recalcula métricas cuando cambia productoId o precio
  useEffect(() => {
    let mounted = true
    async function compute() {
      setCosto(null)
      setImpuestoValor(null)
      setImpuestoMonto(null)
      setMargenPct(null)
      setRentabilidadPct(null)
      if (!productoId) return
      const precioNum = parseNumberInput(precio)
      if (isNaN(precioNum)) return
      setCalculando(true)
      try {
        // Obtener todas las líneas de compra para el producto y promediar `costo_unitario`
        const { data: detalles, error: detErr } = await supabase.from('compras_detalle').select('costo_unitario').eq('producto_id', productoId)
        if (detErr) throw detErr
        const costos: number[] = Array.isArray(detalles) ? detalles.map((d: any) => Number(d.costo_unitario)).filter((n: number) => !isNaN(n)) : []
        const avg = costos.length > 0 ? costos.reduce((s, x) => s + x, 0) / costos.length : 0
        if (!mounted) return
        setCosto(avg)

        // Obtener impuesto (suponemos una única fila con impuesto_venta como porcentaje, p.ej. 18.00)
        const { data: impData } = await supabase.from('impuesto').select('impuesto_venta').limit(1).order('id', { ascending: true })
        const impuestoRow = Array.isArray(impData) && impData.length > 0 ? impData[0] : null
        const impuestoVal = impuestoRow ? Number(impuestoRow.impuesto_venta) : 0
        if (!mounted) return
        setImpuestoValor(impuestoVal)

        // Convertir impuestoVal a tasa (si está en 18 -> 0.18)
        const tasa = impuestoVal > 1 ? impuestoVal / 100 : impuestoVal
        const impuestoCalc = precioNum * tasa
        setImpuestoMonto(impuestoCalc)

        const margenAbs = precioNum - avg
        const margenPctCalc = avg > 0 ? (margenAbs / avg) * 100 : null
        setMargenPct(margenPctCalc)

        const rentab = precioNum > 0 ? ((precioNum - avg - impuestoCalc) / precioNum) * 100 : null
        setRentabilidadPct(rentab)
      } catch (err) {
        // no bloquear UX por errores de cálculo
      } finally {
        if (mounted) setCalculando(false)
      }
    }
    compute()
    return () => { mounted = false }
  }, [productoId, precio])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ width: 640, maxWidth: '95%', background: '#fff', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Agregar precio</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontSize: 13 }}>Producto</label>
          <select className="input" value={productoId ?? ''} onChange={e => setProductoId(e.target.value || null)}>
            <option value="">-- seleccionar producto --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>

          <label style={{ fontSize: 13 }}>Precio</label>
          <input className="input" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 13 }}>Costo (promedio compras)</label>
              <input className="input" value={costo == null ? '' : costo.toFixed(2)} readOnly placeholder="--" />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Impuesto (monto)</label>
              <input className="input" value={impuestoMonto == null ? '' : impuestoMonto.toFixed(2)} readOnly placeholder="--" />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Margen de ganancia (%)</label>
              <input className="input" value={margenPct == null ? '' : margenPct.toFixed(2)} readOnly placeholder="--" />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Rentabilidad (%)</label>
              <input className="input" value={rentabilidadPct == null ? '' : rentabilidadPct.toFixed(2)} readOnly placeholder="--" />
            </div>
          </div>
        </div>

        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn-opaque" onClick={onClose} disabled={saving} style={{ width: 'auto' }}>Cancelar</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving} style={{ width: 'auto', padding: '8px 14px' }}>{saving ? 'Creando...' : 'Crear'}</button>
        </div>
      </div>
    </div>
  )
}
