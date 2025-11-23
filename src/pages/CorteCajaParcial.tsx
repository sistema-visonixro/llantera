import React, { useEffect, useState } from 'react'
import useCajaSession from '../hooks/useCajaSession'
import supabase from '../lib/supabaseClient'
import useHondurasTime from '../lib/useHondurasTime'

export default function CorteCajaParcial({ onBack }: { onBack: () => void }) {
  const { session, loading: sessionLoading, startSession, refreshSession } = useCajaSession()
  const [calculating, setCalculating] = useState(false)
  const [startAmount, setStartAmount] = useState<number | ''>('')

  // Detailed Breakdowns
  const [ingresos, setIngresos] = useState({ efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 })
  const [anulaciones, setAnulaciones] = useState({ efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 })
  const [devoluciones, setDevoluciones] = useState({ efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 })
  const [otrosIngresos, setOtrosIngresos] = useState(0) // From caja_movimientos
  const [otrosEgresos, setOtrosEgresos] = useState(0) // From caja_movimientos

  const { hondurasNowISO } = useHondurasTime()

  useEffect(() => {
    if (session) {
      calculateTotals()
    }
  }, [session])

  const calculateTotals = async () => {
    if (!session) return
    setCalculating(true)
    try {
      const user = session.usuario
      const since = session.fecha_apertura

      // 1. Fetch Pagos (Income & Cancellations)
      // First fetch relevant sales IDs to avoid relying on 'ventas!inner' join which needs explicit FK
      const { data: ventas, error: vErr } = await supabase
        .from('ventas')
        .select('id')
        .eq('usuario', user)
        .gte('fecha_venta', since)

      if (vErr) console.error('Error fetching ventas for ids:', vErr)

      const newIngresos = { efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 }
      const newAnulaciones = { efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 }

      if (ventas && ventas.length > 0) {
        // Cast IDs to string to match pagos.venta_id type (text)
        const ventaIds = ventas.map((v: any) => String(v.id))

        const { data: pagos, error: pErr } = await supabase
          .from('pagos')
          .select('monto, tipo')
          .in('venta_id', ventaIds)

        if (pErr) console.error('Error fetching pagos:', pErr)

        if (pagos) {
          pagos.forEach((p: any) => {
            const monto = Number(p.monto || 0)
            const tipo = (p.tipo || '').toLowerCase()

            // Categorize type
            let category: 'efectivo' | 'tarjeta' | 'transferencia' | 'dolares' | null = null
            if (tipo.includes('efectivo') || tipo === 'cash') category = 'efectivo'
            else if (tipo.includes('tarjeta') || tipo === 'card') category = 'tarjeta'
            else if (tipo.includes('transferencia') || tipo === 'transfer') category = 'transferencia'
            else if (tipo.includes('dolar') || tipo === 'usd') category = 'dolares'

            if (category) {
              if (monto >= 0) {
                newIngresos[category] += monto
                newIngresos.total += monto
              } else {
                // Anulaciones (negative values)
                newAnulaciones[category] += Math.abs(monto)
                newAnulaciones.total += Math.abs(monto)
              }
            }
          })
        }
      }
      setIngresos(newIngresos)
      setAnulaciones(newAnulaciones)

      // 2. Fetch Movimientos (Otros Ingresos/Egresos manuales)
      let movs: any[] = []
      const tableCandidates = ['caja_movimientos']
      for (const tbl of tableCandidates) {
        const { data: mData, error: mErr } = await supabase
          .from(tbl)
          .select('monto, tipo_movimiento')
          .eq('usuario', user)
          .gte('fecha', since)

        if (!mErr && mData) {
          movs = mData
          break
        }
      }

      let totalIng = 0
      let totalEgr = 0
      movs.forEach((m: any) => {
        const tipo = (m.tipo_movimiento || '').toLowerCase()
        const monto = Number(m.monto || 0)
        if (tipo === 'ingreso') totalIng += monto
        if (tipo === 'egreso') totalEgr += monto
      })
      setOtrosIngresos(totalIng)
      setOtrosEgresos(totalEgr)

      // 3. Fetch Devoluciones (Expenses)
      const { data: devs, error: dErr } = await supabase
        .from('devoluciones_ventas')
        .select('total, tipo_devolucion')
        .eq('usuario', user)
        .gte('fecha_devolucion', since)

      if (dErr) console.error('Error fetching devoluciones:', dErr)

      const newDevoluciones = { efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 }
      if (devs) {
        devs.forEach((d: any) => {
          const monto = Number(d.total || 0)
          const tipo = (d.tipo_devolucion || '').toLowerCase()

          // Categorize type (assuming similar mapping or explicit types)
          let category: 'efectivo' | 'tarjeta' | 'transferencia' | 'dolares' | null = null
          if (tipo.includes('efectivo') || tipo === 'devolucion') category = 'efectivo' // Default 'devolucion' to cash?
          else if (tipo.includes('tarjeta')) category = 'tarjeta'
          else if (tipo.includes('transferencia')) category = 'transferencia'
          else if (tipo.includes('dolar')) category = 'dolares'
          // Fallback: if just 'devolucion' and no specific type, assume cash or handle separately?
          // User request implies breakdown. Let's assume 'efectivo' is the main one for cash drawer.

          if (category) {
            newDevoluciones[category] += monto
            newDevoluciones.total += monto
          }
        })
      }
      setDevoluciones(newDevoluciones)

    } catch (e) {
      console.error('Error calculating totals:', e)
    } finally {
      setCalculating(false)
    }
  }

  const handleStartSession = async () => {
    if (startAmount === '' || Number(startAmount) < 0) return alert('Ingrese un monto inicial válido')
    try {
      await startSession(Number(startAmount))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const currency = (v: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(v).replace('HNL', 'L')

  if (sessionLoading) return <div style={{ padding: 20 }}>Cargando sesión...</div>

  if (!session) {
    return (
      <div style={{ padding: 20, maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h2>No hay sesión de caja activa</h2>
        <p>Para comenzar a vender y registrar movimientos, debes abrir una sesión de caja.</p>
        <div style={{ marginTop: 20, background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <label style={{ display: 'block', marginBottom: 10, textAlign: 'left', fontWeight: 600 }}>Monto Inicial (L)</label>
          <input
            type="number"
            className="input"
            value={startAmount}
            onChange={e => setStartAmount(Number(e.target.value))}
            placeholder="0.00"
            style={{ width: '100%', marginBottom: 16 }}
          />
          <button className="btn-primary" style={{ width: '100%' }} onClick={handleStartSession}>Abrir Caja</button>
        </div>
        <button onClick={onBack} className="btn-opaque" style={{ marginTop: 20 }}>Volver</button>
      </div>
    )
  }

  // Saldo Teórico = Monto Inicial + Ingresos Efectivo + Otros Ingresos - Otros Egresos - Devoluciones Efectivo
  // Note: Anulaciones are negative payments, so they reduce the total collected.
  // However, usually "Cash in Drawer" is: Initial + Cash Sales - Cash Returns - Expenses.
  // Anulaciones might just be reversing a sale, so if the sale came in (+100) and was annulled (-100), net is 0.
  // So summing 'ingresos.efectivo' (which only has positives) and subtracting 'anulaciones.efectivo' (positives) ?
  // OR just sum all pagos.monto?
  // User asked for breakdown.
  // Let's calculate Net Cash Flow = (Ingresos Efectivo - Anulaciones Efectivo) + Otros Ingresos - Otros Egresos - Devoluciones Efectivo

  const netCashSales = ingresos.efectivo - anulaciones.efectivo
  const saldoTeorico = (session.monto_inicial || 0) + netCashSales + otrosIngresos - otrosEgresos - devoluciones.efectivo

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '24px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Corte de Caja Parcial</h2>
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Sesión iniciada el: {new Date(session.fecha_apertura).toLocaleString()} por <strong>{session.usuario}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={calculateTotals} className="btn-opaque" disabled={calculating}>
            {calculating ? 'Calculando...' : 'Actualizar datos'}
          </button>
          <button onClick={onBack} className="btn-opaque">Volver</button>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card title="Monto Inicial" value={session.monto_inicial} color="#3b82f6" />
        <Card title="Ventas Netas (Efectivo)" value={netCashSales} color="#10b981" />
        <Card title="Otros Ingresos" value={otrosIngresos} color="#10b981" />
        <Card title="Otros Egresos" value={otrosEgresos} color="#ef4444" />
        <Card title="Devoluciones (Efectivo)" value={devoluciones.efectivo} color="#ef4444" />
      </div>

      {/* Detailed Breakdown Table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '16px 20px', borderBottom: '3px solid #0ea5e9' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: '0.5px' }}>
            📊 Desglose por Tipo de Pago
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Pago</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', color: '#10b981', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <span>↑</span>
                  <span>Ingresos</span>
                </div>
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'right', color: '#f59e0b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <span>⊗</span>
                  <span>Anulaciones</span>
                </div>
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'right', color: '#ef4444', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <span>↓</span>
                  <span>Devoluciones</span>
                </div>
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <span>∑</span>
                  <span>Neto</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <BreakdownRow label="💵 Efectivo" ing={ingresos.efectivo} anl={anulaciones.efectivo} dev={devoluciones.efectivo} />
            <BreakdownRow label="💳 Tarjeta" ing={ingresos.tarjeta} anl={anulaciones.tarjeta} dev={devoluciones.tarjeta} />
            <BreakdownRow label="🏦 Transferencia" ing={ingresos.transferencia} anl={anulaciones.transferencia} dev={devoluciones.transferencia} />
            <BreakdownRow label="💵 Dólares" ing={ingresos.dolares} anl={anulaciones.dolares} dev={devoluciones.dolares} />
            <tr style={{ borderTop: '3px solid #e2e8f0', fontWeight: 700, background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
              <td style={{ padding: '16px', fontSize: 15, color: '#1e293b', letterSpacing: '0.5px' }}>TOTALES</td>
              <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontSize: 15 }}>{currency(ingresos.total)}</td>
              <td style={{ padding: '16px', textAlign: 'right', color: '#f59e0b', fontSize: 15 }}>{currency(anulaciones.total)}</td>
              <td style={{ padding: '16px', textAlign: 'right', color: '#ef4444', fontSize: 15 }}>{currency(devoluciones.total)}</td>
              <td style={{ padding: '16px', textAlign: 'right', fontSize: 16, color: '#1e293b', background: '#e0f2fe', borderRadius: '0 0 8px 0' }}>
                {currency(ingresos.total - anulaciones.total - devoluciones.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: '#475569', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Saldo Teórico en Caja (Efectivo)</h3>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#1e293b', marginTop: 8 }}>
          {currency(saldoTeorico)}
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
          (Monto Inicial + Ingresos Efectivo - Anulaciones Efectivo + Otros Ingresos) - (Otros Egresos + Devoluciones Efectivo)
        </p>
      </section>
    </div>
  )
}

function BreakdownRow({ label, ing, anl, dev }: { label: string, ing: number, anl: number, dev: number }) {
  const currency = (v: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(v).replace('HNL', 'L')
  const net = ing - anl - dev
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfc'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{label}</td>
      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>{currency(ing)}</td>
      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#f59e0b', fontWeight: 500 }}>{currency(anl)}</td>
      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>{currency(dev)}</td>
      <td style={{
        padding: '14px 16px',
        textAlign: 'right',
        fontWeight: 700,
        fontSize: 15,
        color: net >= 0 ? '#059669' : '#dc2626',
        background: net >= 0 ? '#f0fdf4' : '#fef2f2',
        borderLeft: `3px solid ${net >= 0 ? '#10b981' : '#ef4444'}`
      }}>
        {net >= 0 ? '+' : ''}{currency(net)}
      </td>
    </tr>
  )
}

function Card({ title, value, color }: { title: string, value: number, color: string }) {
  const currency = (v: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(v).replace('HNL', 'L')
  return (
    <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{currency(value)}</div>
    </div>
  )
}
