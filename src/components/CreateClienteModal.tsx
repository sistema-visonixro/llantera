import React from 'react'
import ZoomWrapper from './ZoomWrapper'

type Props = {
  open: boolean
  onClose: () => void
  clienteRTN: string
  clienteNombre: string
  clienteTelefono: string
  clienteCorreo: string
  clienteExonerado: boolean
  onChangeRTN: (v: string) => void
  onChangeNombre: (v: string) => void
  onChangeTelefono: (v: string) => void
  onChangeCorreo: (v: string) => void
  onChangeExonerado: (v: boolean) => void
  onCreate: () => Promise<void>
}

export default function CreateClienteModal({ open, onClose, clienteRTN, clienteNombre, clienteTelefono, clienteCorreo, clienteExonerado, onChangeRTN, onChangeNombre, onChangeTelefono, onChangeCorreo, onChangeExonerado, onCreate }: Props) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <ZoomWrapper>
        <div style={{ width: 680, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 18px 50px rgba(2,6,23,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Crear Cliente Jurídico</h3>
          <button onClick={onClose} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
        </div>

        <p style={{ color: '#475569', marginTop: 6 }}>Complete los datos del cliente jurídico. El campo tipo se fijará a <strong>juridico</strong>.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#334155' }}>RTN</label>
            <input value={clienteRTN} onChange={e => onChangeRTN(e.target.value)} placeholder="00000000000000" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#334155' }}>Razón social</label>
            <input value={clienteNombre} onChange={e => onChangeNombre(e.target.value)} placeholder="Razón social" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#334155' }}>Teléfono</label>
            <input value={clienteTelefono} onChange={e => onChangeTelefono(e.target.value)} placeholder="Teléfono" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#334155' }}>Correo electrónico</label>
            <input value={clienteCorreo} onChange={e => onChangeCorreo(e.target.value)} placeholder="correo@ejemplo.com" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="exon" type="checkbox" checked={clienteExonerado} onChange={e => onChangeExonerado(e.target.checked)} />
            <label htmlFor="exon">Exonerado</label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} className="btn-opaque" style={{ background: 'transparent', color: '#111' }}>Cancelar</button>
          <button onClick={async () => { await onCreate() }} className="btn-opaque" style={{ opacity: (!clienteNombre || !clienteRTN) ? 0.6 : 1 }} disabled={!clienteNombre || !clienteRTN}>Crear cliente</button>
        </div>
        </div>
      </ZoomWrapper>
    </div>
  )
}
