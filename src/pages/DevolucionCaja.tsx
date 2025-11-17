import React from 'react'

export default function DevolucionCaja({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '24px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Devolución de Caja</h2>
        <button onClick={onBack} className="btn-opaque" style={{ padding: '8px 12px' }}>Volver</button>
      </header>

      <section style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 6px rgba(2,6,23,0.06)' }}>
        <p>Esta vista servirá para gestionar devoluciones en la caja. Aquí podrás registrar y revisar devoluciones realizadas.</p>
        <p style={{ color: '#6b7280' }}>Contenido placeholder — implementar lógica de devoluciones según requisitos.</p>
      </section>
    </div>
  )
}
