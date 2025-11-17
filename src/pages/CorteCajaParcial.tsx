import React from 'react'

export default function CorteCajaParcial({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '24px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Corte de Caja Parcial</h2>
        <button onClick={onBack} className="btn-opaque" style={{ padding: '8px 12px' }}>Volver</button>
      </header>

      <section style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 6px rgba(2,6,23,0.06)' }}>
        <p>Registrar corte parcial de caja. Muestra resumen de ventas desde el último corte.</p>
        <p style={{ color: '#6b7280' }}>Placeholder: implementar cálculo y persistencia de cortes.</p>
      </section>
    </div>
  )
}
