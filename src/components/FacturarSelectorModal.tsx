import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  doFacturaClienteFinal: () => void
  doFacturaClienteNormal: () => void
  doFacturaClienteJuridico: () => void
  carritoLength: number
  subtotal: number
  taxRate: number
  taxableSubtotal: number
}

export default function FacturarSelectorModal({ open, onClose, doFacturaClienteFinal, doFacturaClienteNormal, doFacturaClienteJuridico, carritoLength, subtotal, taxRate, taxableSubtotal }: Props) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: 640, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 18px 50px rgba(2,6,23,0.35)', display: 'flex', gap: 16, alignItems: 'stretch' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Seleccionar tipo de cliente</h3>
            <button onClick={onClose} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
          </div>

          <p style={{ color: '#475569', marginTop: 6 }}>Elige si la factura será para Cliente Final o para un Cliente registrado. Cliente Final genera una factura inmediata lista para imprimir. Cliente Normal permite ingresar datos del cliente.</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div onClick={doFacturaClienteFinal} role="button" tabIndex={0} style={{ flex: 1, borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', border: '1px solid #e6edf3', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>👤</div>
              <div style={{ fontWeight: 700 }}>Cliente Final</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Factura para consumidor final. No requiere RTN.</div>
              <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 700 }}>&nbsp;</div>
            </div>
            <div onClick={doFacturaClienteNormal} role="button" tabIndex={0} style={{ flex: 1, borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', border: '1px solid #e6edf3', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🏷️</div>
              <div style={{ fontWeight: 700 }}>Cliente Normal</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Ingresar nombre y número de identificación (RTN) para la factura.</div>
              <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 700 }}>&nbsp;</div>
            </div>

            <div onClick={doFacturaClienteJuridico} role="button" tabIndex={0} style={{ flex: 1, borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', border: '1px solid #e6edf3', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🏢</div>
              <div style={{ fontWeight: 700 }}>Cliente Jurídico</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Ingresar razón social y número de identificación (RTN) para la factura.</div>
              <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 700 }}>&nbsp;</div>
            </div>
          </div>
        </div>

        <div style={{ width: 220, borderLeft: '1px dashed #e6edf3', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700 }}>Resumen</div>
          <div style={{ color: '#475569' }}>Items: <strong>{carritoLength}</strong></div>
          <div style={{ color: '#475569' }}>SubTotal: <strong>L {subtotal.toFixed(2)}</strong></div>
          <div style={{ color: '#475569' }}>ISV ({(taxRate*100).toFixed(2)}%): <strong>L {(taxableSubtotal*taxRate).toFixed(2)}</strong></div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>Total: L {(subtotal + (taxableSubtotal*taxRate)).toFixed(2)}</div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>Seleccione una opción para continuar.</div>
        </div>
      </div>
    </div>
  )
}
