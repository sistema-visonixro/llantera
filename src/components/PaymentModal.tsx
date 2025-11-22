import React, { useState, useEffect } from 'react'

type PagoItem = {
  id: string
  tipo: 'efectivo' | 'tarjeta' | 'transferencia'
  monto: number
  banco?: string
  tarjeta?: string
  factura?: string
  autorizador?: string
  referencia?: string
}

type PaymentPayload = {
  efectivo: number
  tarjeta: number
  transferencia: number
  totalPaid: number
  tipoPagoString: string
  pagos?: PagoItem[]
}

export default function PaymentModal({ open, onClose, totalDue, onConfirm }:
  { open: boolean, onClose: () => void, totalDue: number, onConfirm: (p: PaymentPayload) => void }) {
  const [pagos, setPagos] = useState<PagoItem[]>([])
  const [tipo, setTipo] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [monto, setMonto] = useState<number>(0)
  const [banco, setBanco] = useState<string>('')
  const [tarjeta, setTarjeta] = useState<string>('')
  const [factura, setFactura] = useState<string>('')
  const [autorizador, setAutorizador] = useState<string>('')
  const [referencia, setReferencia] = useState<string>('')

  useEffect(() => {
    if (!open) {
      // limpiar formulario y lista al cerrar
      setPagos([])
      setTipo('efectivo')
      setMonto(0)
      setBanco('')
      setTarjeta('')
      setFactura('')
      setAutorizador('')
      setReferencia('')
    }
  }, [open])

  const parseNumber = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? Number(n.toFixed(2)) : 0
  }

  const agregarPago = () => {
    const montoN = parseNumber(monto)
    if (montoN <= 0) return
    const nuevo: PagoItem = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
      tipo,
      monto: montoN,
      banco: banco || undefined,
      tarjeta: tarjeta || undefined,
      factura: factura || undefined,
      autorizador: autorizador || undefined,
      referencia: referencia || undefined,
    }
    setPagos(prev => [...prev, nuevo])
    // reset del formulario parcial
    setMonto(0); setBanco(''); setTarjeta(''); setFactura(''); setAutorizador(''); setReferencia('')
  }

  const eliminarPago = (id: string) => {
    setPagos(prev => prev.filter(p => p.id !== id))
  }

  const efectivoSum = pagos.filter(p => p.tipo === 'efectivo').reduce((s, p) => s + p.monto, 0)
  const tarjetaSum = pagos.filter(p => p.tipo === 'tarjeta').reduce((s, p) => s + p.monto, 0)
  const transferenciaSum = pagos.filter(p => p.tipo === 'transferencia').reduce((s, p) => s + p.monto, 0)

  const totalPaid = Number((efectivoSum + tarjetaSum + transferenciaSum).toFixed(2))
  const remaining = Number((totalDue - totalPaid).toFixed(2))
  const canConfirm = totalPaid >= totalDue && totalPaid > 0

  const currency = (v: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(v).replace('HNL', 'L')

  const handleConfirm = () => {
    const parts: string[] = []
    if (efectivoSum > 0) parts.push(`efectivo:(${efectivoSum.toFixed(2)})`)
    if (tarjetaSum > 0) parts.push(`tarjeta:(${tarjetaSum.toFixed(2)})`)
    if (transferenciaSum > 0) parts.push(`transferencia:(${transferenciaSum.toFixed(2)})`)
    const tipoPagoString = parts.join(',')
    onConfirm({ efectivo: efectivoSum, tarjeta: tarjetaSum, transferencia: transferenciaSum, totalPaid, tipoPagoString, pagos })
    onClose()
  }

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 }}>
      <div style={{ width: 900, maxWidth: '98%', background: 'white', borderRadius: 10, padding: 20, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Registrar Pago</h3>
          <button onClick={onClose} className="btn-opaque">Cerrar</button>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          {/* izquierda: mini tabla de pagos y totales */}
          <div>
            <div style={{ marginBottom: 8 }}>Total a pagar: <strong>{currency(totalDue)}</strong></div>

            <div style={{ border: '1px solid #e6edf3', borderRadius: 8, padding: 8, marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #efefef' }}>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Detalles</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 12, color: '#666' }}>No hay pagos registrados</td></tr>
                  )}
                  {pagos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '8px 4px' }}>{p.tipo}</td>
                      <td style={{ padding: '8px 4px' }}>{currency(p.monto)}</td>
                      <td style={{ padding: '8px 4px', fontSize: 12 }}>
                        {p.tipo === 'efectivo' && <span>—</span>}
                        {p.tipo === 'tarjeta' && <span>{p.banco || '-'} / {p.tarjeta || '-'} / {p.factura || '-'}</span>}
                        {p.tipo === 'transferencia' && <span>{p.banco || '-'} / {p.referencia || '-'}</span>}
                      </td>
                      <td style={{ padding: '8px 4px' }}><button onClick={() => eliminarPago(p.id)} className="btn-opaque" style={{ background: 'transparent' }}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: 8, borderRadius: 6, border: '1px solid #e6edf3', minWidth: 140 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Efectivo</div>
                <div style={{ fontWeight: 600 }}>{currency(efectivoSum)}</div>
              </div>
              <div style={{ padding: 8, borderRadius: 6, border: '1px solid #e6edf3', minWidth: 140 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Tarjeta</div>
                <div style={{ fontWeight: 600 }}>{currency(tarjetaSum)}</div>
              </div>
              <div style={{ padding: 8, borderRadius: 6, border: '1px solid #e6edf3', minWidth: 140 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Transferencia</div>
                <div style={{ fontWeight: 600 }}>{currency(transferenciaSum)}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Total ingresado</div>
                <div style={{ fontWeight: 700 }}>{currency(totalPaid)}</div>
                <div style={{ marginTop: 6, color: remaining > 0 ? '#ef4444' : '#16a34a' }}>{remaining > 0 ? `Falta ${currency(remaining)}` : `Cambio ${currency(Math.abs(remaining))}`}</div>
              </div>
            </div>
          </div>

          {/* derecha: formulario para agregar pago */}
          <div style={{ border: '1px solid #e6edf3', borderRadius: 8, padding: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Tipo de pago</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as any)} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Monto</label>
              <input type="number" min={0} step="0.01" value={monto} onChange={e => setMonto(parseNumber(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
            </div>

            {tipo === 'efectivo' && (
              <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>Pago en efectivo: solo indique el monto y presione "Agregar".</div>
            )}

            {tipo === 'tarjeta' && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Banco</label>
                  <input value={banco} onChange={e => setBanco(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Tarjeta (últimos 4)</label>
                  <input value={tarjeta} onChange={e => setTarjeta(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>Factura</label>
                    <input value={factura} onChange={e => setFactura(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>Autorizador</label>
                    <input value={autorizador} onChange={e => setAutorizador(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                  </div>
                </div>
              </>
            )}

            {tipo === 'transferencia' && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Banco</label>
                  <input value={banco} onChange={e => setBanco(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Referencia</label>
                  <input value={referencia} onChange={e => setReferencia(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={agregarPago} className="btn-opaque" style={{ background: '#0ea5a4', color: 'white', padding: '8px 12px', borderRadius: 6 }}>Agregar</button>
              <button onClick={() => { setMonto(totalDue - totalPaid) }} className="btn-opaque" style={{ background: 'transparent' }}>Exacto</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} className="btn-opaque" style={{ background: 'transparent' }}>Cancelar</button>
          <button onClick={handleConfirm} className="btn-opaque" disabled={!canConfirm} style={{ background: canConfirm ? '#16a34a' : 'gray', color: 'white' }}>Registrar y guardar venta</button>
        </div>
      </div>
    </div>
  )
}
