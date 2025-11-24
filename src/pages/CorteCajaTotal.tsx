import React, { useEffect, useState } from 'react'
import useCajaSession from '../hooks/useCajaSession'
import useHondurasTime from '../lib/useHondurasTime'
import ModalWrapper from '../components/ModalWrapper'
import useDevolucionesTotales from '../hooks/useDevolucionesTotales'
import usePagosTotals from '../hooks/usePagosTotals'
import useCajaMovimientosTotals from '../hooks/useCajaMovimientosTotals'
import useVentasAnuladas from '../hooks/useVentasAnuladas'

export default function CorteCajaTotal({ onBack }: { onBack: () => void }) {
  const { session, loading: sessionLoading, closeSession } = useCajaSession()

  // Hooks for data fetching (aligned with CorteCajaParcial)
  const { totals: pagosTotals, loading: pagosLoading, reload: reloadPagos } = usePagosTotals(session?.fecha_apertura ?? null, session?.usuario ?? null)
  const { data: cajaMovs, loading: cajaMovsLoading, reload: reloadCajaMovs } = useCajaMovimientosTotals(session?.fecha_apertura ?? null, session?.usuario ?? null)
  const { data: ventasAnuladas, loading: ventasAnuladasLoading, reload: reloadVentasAnuladas } = useVentasAnuladas(session?.fecha_apertura ?? null, session?.usuario ?? null)
  const { totals: devolucionesTotals, loading: devolucionesLoading, reload: reloadDevoluciones } = useDevolucionesTotales(session?.fecha_apertura ?? null, session?.usuario ?? null)

  // User Input
  const [physicalCount, setPhysicalCount] = useState<number | ''>('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { hondurasNowISO } = useHondurasTime()

  // Reload data when session changes
  useEffect(() => {
    if (session) {
      reloadPagos()
      reloadCajaMovs()
      reloadVentasAnuladas()
      reloadDevoluciones()
    }
  }, [session, reloadPagos, reloadCajaMovs, reloadVentasAnuladas, reloadDevoluciones])

  // Helper to normalize types
  const normalizeTipo = (s: string = '') => {
    const t = s.toLowerCase()
    if (t.includes('efect')) return 'efectivo'
    if (t.includes('dolar') || t.includes('usd')) return 'dolares'
    if (t.includes('tarj')) return 'tarjeta'
    if (t.includes('transfer')) return 'transferencia'
    return 'efectivo'
  }

  // Derived State Calculations

  // 1. Ingresos (Pagos)
  const ingresos = {
    efectivo: pagosTotals?.efectivo || 0,
    tarjeta: pagosTotals?.tarjeta || 0,
    transferencia: pagosTotals?.transferencia || 0,
    dolares: pagosTotals?.dolares || 0,
    total: pagosTotals?.total || 0
  }

  // 2. Anulaciones
  const anulaciones = { efectivo: 0, tarjeta: 0, transferencia: 0, dolares: 0, total: 0 }
  if (Array.isArray(ventasAnuladas)) {
    ventasAnuladas.forEach((r: any) => {
      const cat = normalizeTipo(r.tipo)
      const monto = Number(r.total_monto || 0)
      // @ts-ignore
      if (anulaciones[cat] !== undefined) anulaciones[cat] += monto
      anulaciones.total += monto
    })
  }

  // 3. Devoluciones
  const devoluciones = {
    efectivo: devolucionesTotals?.efectivo || 0,
    tarjeta: devolucionesTotals?.tarjeta || 0,
    transferencia: devolucionesTotals?.transferencia || 0,
    dolares: devolucionesTotals?.dolares || 0,
    total: devolucionesTotals?.total || 0
  }

  // 4. Caja Movimientos (Otros Ingresos / Egresos)
  let otrosIngresos = 0
  let otrosEgresos = 0
  if (Array.isArray(cajaMovs)) {
    cajaMovs.forEach((r: any) => {
      const tipo = String(r.tipo_movimiento || '').toLowerCase()
      const monto = Number(r.total_monto || r.monto || 0)
      const isEgreso = tipo.includes('egreso') || tipo.includes('salida') || tipo.includes('salir') || tipo.includes('retirada')
      const isIngreso = tipo.includes('ingreso') || tipo.includes('entrada') || (!isEgreso)
      if (isEgreso) otrosEgresos += monto
      else if (isIngreso) otrosIngresos += monto
    })
  }

  const netCashSales = ingresos.efectivo - anulaciones.efectivo
  const saldoTeorico = (session?.monto_inicial || 0) + netCashSales + otrosIngresos - otrosEgresos - devoluciones.efectivo

  const handleCloseSession = async () => {
    if (!session) return
    try {
      await closeSession({
        total_ingresos: ingresos.total + otrosIngresos,
        total_egresos: otrosEgresos + devoluciones.total + anulaciones.total,
        saldo_final: saldoTeorico
      })
      alert('Caja cerrada exitosamente.')
      onBack()
    } catch (e: any) {
      alert('Error cerrando caja: ' + e.message)
    }
  }

  const currency = (v: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(v).replace('HNL', 'L')

  if (sessionLoading) return <div style={{ padding: 20 }}>Cargando sesión...</div>

  if (!session) {
    return (
      <div style={{ padding: 20, maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h2>No hay sesión de caja activa</h2>
        <p>No se puede realizar un corte total sin una sesión abierta.</p>
        <button onClick={onBack} className="btn-opaque" style={{ marginTop: 20 }}>Volver</button>
      </div>
    )
  }

  const physical = physicalCount === '' ? 0 : physicalCount
  const difference = physical - saldoTeorico

  const isLoadingData = pagosLoading || cajaMovsLoading || ventasAnuladasLoading || devolucionesLoading

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '24px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Corte de Caja Total</h2>
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Cerrando sesión de: <strong>{session.usuario}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isLoadingData && <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Actualizando datos...</span>}
          <button onClick={onBack} className="btn-opaque">Volver</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column: Summary & Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Detailed Breakdown Table */}
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '16px 20px', borderBottom: '3px solid #0ea5e9' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: '0.5px' }}>
                📊 Desglose por Tipo de Pago
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', color: '#10b981', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span>↑</span>
                      <span>Ing</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', color: '#f59e0b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span>⊗</span>
                      <span>Anul</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span>↓</span>
                      <span>Dev</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span>∑</span>
                      <span>Neto</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <BreakdownRow label="💵 Efectivo" ing={ingresos.efectivo} anl={anulaciones.efectivo} dev={devoluciones.efectivo} />
                <BreakdownRow label="💳 Tarjeta" ing={ingresos.tarjeta} anl={anulaciones.tarjeta} dev={devoluciones.tarjeta} />
                <BreakdownRow label="🏦 Transfer" ing={ingresos.transferencia} anl={anulaciones.transferencia} dev={devoluciones.transferencia} />
                <BreakdownRow label="💵 Dólares" ing={ingresos.dolares} anl={anulaciones.dolares} dev={devoluciones.dolares} />
                <tr style={{ borderTop: '3px solid #e2e8f0', fontWeight: 700, background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
                  <td style={{ padding: '14px', fontSize: 14, color: '#1e293b', letterSpacing: '0.5px' }}>TOTAL</td>
                  <td style={{ padding: '14px', textAlign: 'right', color: '#10b981', fontSize: 14 }}>{currency(ingresos.total)}</td>
                  <td style={{ padding: '14px', textAlign: 'right', color: '#f59e0b', fontSize: 14 }}>{currency(anulaciones.total)}</td>
                  <td style={{ padding: '14px', textAlign: 'right', color: '#ef4444', fontSize: 14 }}>{currency(devoluciones.total)}</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontSize: 15, color: '#1e293b', background: '#e0f2fe', borderRadius: '0 0 8px 0' }}>
                    {currency(ingresos.total - anulaciones.total - devoluciones.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#475569' }}>Resumen de Caja (Efectivo)</h3>
            <Row label="Monto Inicial" value={session.monto_inicial} />
            <Row label="Ventas Netas (Efectivo)" value={netCashSales} isPlus />
            <Row label="Otros Ingresos" value={otrosIngresos} isPlus />
            <Row label="Otros Egresos" value={otrosEgresos} isMinus />
            <Row label="Devoluciones (Efectivo)" value={devoluciones.efectivo} isMinus />
            <div style={{ borderTop: '2px solid #e2e8f0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Saldo Teórico</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>{currency(saldoTeorico)}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification & Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#475569' }}>Conteo Físico</h3>

            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Dinero en Caja (L)</label>
            <input
              type="number"
              className="input"
              value={physicalCount}
              onChange={e => setPhysicalCount(Number(e.target.value))}
              placeholder="0.00"
              style={{ width: '100%', fontSize: 16, padding: 10, marginBottom: 16 }}
            />

            <div style={{ background: difference === 0 ? '#f0fdf4' : '#fef2f2', padding: 12, borderRadius: 6, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: difference === 0 ? '#166534' : '#991b1b', marginBottom: 4 }}>Diferencia</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: difference === 0 ? '#16a34a' : '#ef4444' }}>
                {difference > 0 ? '+' : ''}{currency(difference)}
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: 12, fontSize: 15 }}
              onClick={() => setConfirmOpen(true)}
              disabled={physicalCount === ''}
            >
              Cerrar Caja
            </button>
          </div>
        </div>
      </div>

      <ModalWrapper open={confirmOpen} onClose={() => setConfirmOpen(false)} width={400}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>¿Confirmar Cierre?</h3>
          <p>Se cerrará la sesión actual y se registrarán los totales.</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>Esta acción no se puede deshacer.</p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={() => setConfirmOpen(false)} className="btn-opaque">Cancelar</button>
            <button onClick={handleCloseSession} className="btn-primary" style={{ background: '#ef4444', color: 'white' }}>Confirmar Cierre</button>
          </div>
        </div>
      </ModalWrapper>
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
      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{label}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>{currency(ing)}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f59e0b', fontWeight: 500 }}>{currency(anl)}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>{currency(dev)}</td>
      <td style={{
        padding: '12px 14px',
        textAlign: 'right',
        fontWeight: 700,
        fontSize: 14,
        color: net >= 0 ? '#059669' : '#dc2626',
        background: net >= 0 ? '#f0fdf4' : '#fef2f2',
        borderLeft: `3px solid ${net >= 0 ? '#10b981' : '#ef4444'}`
      }}>
        {net >= 0 ? '+' : ''}{currency(net)}
      </td>
    </tr>
  )
}

function Row({ label, value, isPlus, isMinus }: { label: string, value: number, isPlus?: boolean, isMinus?: boolean }) {
  const currency = (v: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(v).replace('HNL', 'L')
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
      <div style={{ color: '#475569' }}>{label}</div>
      <div style={{ fontWeight: 500, color: isPlus ? '#16a34a' : isMinus ? '#ef4444' : '#1e293b' }}>
        {isMinus ? '-' : ''}{currency(value)}
      </div>
    </div>
  )
}
