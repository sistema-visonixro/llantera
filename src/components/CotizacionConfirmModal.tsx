import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onCancel: () => void
  onSave: () => Promise<void>
}

export default function CotizacionConfirmModal({ open, onClose, onCancel, onSave }: Props) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: 520, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 18px 50px rgba(2,6,23,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Guardar cotización</h3>
          <button onClick={onClose} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
        </div>
        <p style={{ color: '#475569' }}>¿Desea guardar esta cotización en el sistema al finalizar el flujo?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onCancel} className="btn-opaque" style={{ background: 'transparent', color: '#111' }}>No, cerrar</button>
          <button onClick={async () => { await onSave(); }} className="btn-opaque" style={{ background: '#2563eb', color: 'white' }}>Sí, guardar</button>
        </div>
      </div>
    </div>
  )
}
