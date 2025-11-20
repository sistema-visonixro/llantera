import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

type PrecioRow = {
  id: number
  producto_id: string
  precio: string
}

type Props = {
  open: boolean
  onClose: () => void
  row: PrecioRow | null
  products: Array<{ id: string; nombre: string }>
  availableProducts?: Array<{ id: string; nombre: string }>
  onSave: (id: number, payload: { producto_id?: string; precio?: string }) => Promise<void>
}

export default function PreciosEditModal({ open, onClose, row, products, availableProducts, onSave }: Props) {
  const [productoId, setProductoId] = useState<string | null>(null)
  const [precio, setPrecio] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costo, setCosto] = useState<number | null>(null)
  const [impuestoValor, setImpuestoValor] = useState<number | null>(null)
  const [impuestoMonto, setImpuestoMonto] = useState<number | null>(null)
  const [exentoFlag, setExentoFlag] = useState<boolean | null>(null)
  const [aplica18Flag, setAplica18Flag] = useState<boolean | null>(null)
  const [aplicaTurFlag, setAplicaTurFlag] = useState<boolean | null>(null)
  const [margenPct, setMargenPct] = useState<number | null>(null)
  const [rentabilidadPct, setRentabilidadPct] = useState<number | null>(null)
  const [calculando, setCalculando] = useState(false)

  useEffect(() => {
    if (!open || !row) return
    setProductoId(row.producto_id)
    // format precio to two decimals when opening
    try {
      const n = Number(row.precio)
      setPrecio(!isNaN(n) ? n.toFixed(2) : String(row.precio))
    } catch {
      setPrecio(row.precio)
    }
    setError(null)
  }, [open, row])

  function parseNumberInput(v: string) {
    if (!v) return NaN
    return Number(v.replace(',', '.'))
  }

  useEffect(() => {
    let mounted = true
    async function compute() {
      setCosto(null)
      setImpuestoValor(null)
      setImpuestoMonto(null)
      setMargenPct(null)
      setRentabilidadPct(null)
      if (!open || !row || !productoId) return
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

        // Cargar producto y valores de impuesto
        let prodExento = false
        let prodAplica18 = false
        let prodAplicaTur = false
        try {
          const { data: prodData, error: prodErr } = await supabase.from('inventario').select('exento,aplica_impuesto_18,aplica_impuesto_turistico').eq('id', productoId).single()
          if (!prodErr && prodData) {
            prodExento = Boolean(prodData.exento)
            prodAplica18 = Boolean(prodData.aplica_impuesto_18)
            prodAplicaTur = Boolean(prodData.aplica_impuesto_turistico)
            if (exentoFlag === null) setExentoFlag(prodExento)
            if (aplica18Flag === null) setAplica18Flag(prodAplica18)
            if (aplicaTurFlag === null) setAplicaTurFlag(prodAplicaTur)
          }
        } catch (err) {
          // ignore
        }

        const { data: impAll } = await supabase.from('impuesto').select('id, impuesto_venta')
        const impMap: Record<string, number> = {}
        if (Array.isArray(impAll)) impAll.forEach((r: any) => (impMap[String(r.id)] = Number(r.impuesto_venta)))

        const effectiveExento = exentoFlag !== null ? exentoFlag : prodExento
        const effective18 = aplica18Flag !== null ? aplica18Flag : prodAplica18
        const effectiveTur = aplicaTurFlag !== null ? aplicaTurFlag : prodAplicaTur

        let basePct = 0
        if (effectiveExento) basePct = 0
        else if (effective18) basePct = impMap['2'] ?? impMap['1'] ?? 0
        else basePct = impMap['1'] ?? 0

        let turPct = 0
        if (effectiveTur) turPct = impMap['3'] ?? 0

        const totalPct = (basePct || 0) + (turPct || 0)
        const tasa = totalPct > 1 ? totalPct / 100 : totalPct
        const impuestoCalc = precioNum * tasa
        setImpuestoValor(totalPct)
        setImpuestoMonto(impuestoCalc)

        const margenAbs = precioNum - avg
        const margenPctCalc = avg > 0 ? (margenAbs / avg) * 100 : null
        setMargenPct(margenPctCalc)

        const rentab = precioNum > 0 ? ((precioNum - avg - impuestoCalc) / precioNum) * 100 : null
        setRentabilidadPct(rentab)
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setCalculando(false)
      }
    }
    compute()
    return () => { mounted = false }
  }, [open, row, productoId, precio, exentoFlag, aplica18Flag, aplicaTurFlag])

  if (!open || !row) return null

  async function handleSave() {
    const missing: string[] = []
    if (!productoId) missing.push('Producto')
    if (!precio) missing.push('Precio')
    if (missing.length > 0) { setError(`Faltan campos: ${missing.join(', ')}`); return }
    const n = Number(precio)
    if (isNaN(n) || n < 0) { setError('Precio inválido'); return }

    setSaving(true)
    setError(null)
    try {
      // `row` is non-null because we return earlier if not open or no row
      const id = row!.id
      await onSave(id, { producto_id: productoId as string, precio: precio })

      // Persistir flags en inventario si el usuario cambió/toggeó valores
      try {
        const payload: any = {}
        if (exentoFlag !== null) payload.exento = exentoFlag
        if (aplica18Flag !== null) payload.aplica_impuesto_18 = aplica18Flag
        if (aplicaTurFlag !== null) payload.aplica_impuesto_turistico = aplicaTurFlag
        if (Object.keys(payload).length > 0 && productoId) {
          const { error: updErr } = await supabase.from('inventario').update(payload).eq('id', productoId)
          if (updErr) console.warn('Error actualizando inventario flags:', updErr)
        }
      } catch (err) {
        console.warn('Error al persistir flags en inventario:', err)
      }
      onClose()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ width: 640, maxWidth: '95%', background: '#fff', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Editar precio — ID {row.id}</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontSize: 13 }}>Producto</label>
          <select className="input" value={productoId ?? ''} onChange={e => setProductoId(e.target.value || null)}>
            <option value="">-- seleccionar producto --</option>
            {(availableProducts ?? products).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={Boolean(exentoFlag)} onChange={(e) => setExentoFlag(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Exento (si activo, impuesto = 0)</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={Boolean(aplica18Flag)} onChange={(e) => setAplica18Flag(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Usar impuesto 18% (id=2)</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={Boolean(aplicaTurFlag)} onChange={(e) => setAplicaTurFlag(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Impuesto turístico (+ id=3)</span>
            </label>
          </div>

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
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: 'auto', padding: '8px 14px' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}
