import React, { useState, useEffect } from 'react'
import ZoomWrapper from './ZoomWrapper'

export default function CajaConfigModal({ open, onClose, printFormat, onPrintFormatChange, exchangeRate, onExchangeRateChange }:
  { open: boolean, onClose: () => void, printFormat: 'carta'|'cinta', onPrintFormatChange: (f: 'carta'|'cinta') => void, exchangeRate: number, onExchangeRateChange: (v: number) => void }) {

  const [localExchange, setLocalExchange] = useState<number>(exchangeRate || 0)
  const [localFormat, setLocalFormat] = useState<'carta'|'cinta'>(printFormat || 'carta')

  useEffect(() => {
    setLocalExchange(exchangeRate || 0)
  }, [exchangeRate, open])

  useEffect(() => {
    setLocalFormat(printFormat || 'carta')
  }, [printFormat, open])

  if (!open) return null

  const save = () => {
    try { onPrintFormatChange(localFormat) } catch (e) {}
    try { onExchangeRateChange(Number((localExchange || 0).toFixed(2))) } catch (e) {}
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000 }}>
      <ZoomWrapper>
        <div style={{ width: 420, background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>Configuración de caja</h4>
          <button onClick={onClose} className="btn-opaque" style={{ background: 'transparent', color: '#0b1724', border: '1px solid rgba(16,24,40,0.06)', padding: '6px 10px' }}>Cerrar</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Impresión</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLocalFormat('carta')} className="btn-opaque" style={{ padding: '6px 10px', background: localFormat === 'carta' ? '#0ea5e9' : 'transparent', color: localFormat === 'carta' ? 'white' : '#0b1724' }}>Carta</button>
            <button onClick={() => setLocalFormat('cinta')} className="btn-opaque" style={{ padding: '6px 10px', background: localFormat === 'cinta' ? '#0ea5e9' : 'transparent', color: localFormat === 'cinta' ? 'white' : '#0b1724' }}>Cinta</button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Tipo de cambio Lps / $</label>
          <input type="number" min={0} step="0.01" value={localExchange} onChange={e => setLocalExchange(Number(e.target.value || 0))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf3' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} className="btn-opaque" style={{ background: 'transparent', color: '#0b1724', border: '1px solid rgba(16,24,40,0.06)', padding: '8px 12px' }}>Cancelar</button>
          <button onClick={save} className="btn-opaque" style={{ background: '#16a34a', color: 'white' }}>Guardar</button>
        </div>
        </div>
      </ZoomWrapper>
    </div>
  )
}
