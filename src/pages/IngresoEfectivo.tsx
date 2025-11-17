import React, { useEffect, useState } from 'react'

type Ingreso = {
  id: number;
  factura: string;
  motivo: string;
  monto: number;
  fechaHora: string;
  usuario: string;
}

export default function IngresoEfectivo({ onBack }: { onBack: () => void }) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading] = useState(true)

  const [factura, setFactura] = useState('')
  const [motivo, setMotivo] = useState('')
  const [monto, setMonto] = useState<number | ''>('')
  const [fechaHora, setFechaHora] = useState(() => new Date().toISOString().slice(0,16))
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) return JSON.parse(raw).username || 'usuario'
    } catch {}
    return 'usuario'
  })

  useEffect(() => {
    // cargar datos iniciales desde public JSON y merge con localStorage
    fetch('/data-base/ingreso-de-efectivo.json')
      .then(r => r.json())
      .then(data => {
        const fromFile: Ingreso[] = (data && Array.isArray(data.ingresos)) ? data.ingresos : []
        const fromStorageRaw = localStorage.getItem('ingresosEfectivo')
        let fromStorage: Ingreso[] = []
        try { if (fromStorageRaw) fromStorage = JSON.parse(fromStorageRaw) } catch {}
        // merge keeping storage items last (newer)
        const merged = [...fromFile, ...fromStorage]
        setIngresos(merged)
      }).catch(() => {
        const fromStorageRaw = localStorage.getItem('ingresosEfectivo')
        try { if (fromStorageRaw) setIngresos(JSON.parse(fromStorageRaw)) } catch { setIngresos([]) }
      }).finally(() => setLoading(false))
  }, [])

  function saveToStorage(list: Ingreso[]) {
    localStorage.setItem('ingresosEfectivo', JSON.stringify(list))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!motivo || monto === '' || Number(monto) <= 0) return alert('Complete motivo y monto válido')
    const id = ingresos.length ? Math.max(...ingresos.map(i=>i.id)) + 1 : 1
    const nuevo: Ingreso = { id, factura: factura || `F-${id}`, motivo, monto: Number(monto), fechaHora: new Date(fechaHora).toISOString(), usuario }
    const next = [...ingresos, nuevo]
    setIngresos(next)
    saveToStorage(next)
    // limpiar
    setFactura('')
    setMotivo('')
    setMonto('')
    setFechaHora(new Date().toISOString().slice(0,16))
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '24px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Ingreso de Efectivo</h2>
        <button onClick={onBack} className="btn-opaque" style={{ padding: '8px 12px' }}>Volver</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
        <section style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 6px rgba(2,6,23,0.06)' }}>
          <h3 style={{ marginTop: 0 }}>Registros de Ingresos</h3>
          {loading ? <p>Cargando...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Factura</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Motivo</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Monto</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Fecha y hora</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 18, textAlign: 'center', color: '#94a3b8' }}>No hay registros</td></tr>
                  ) : ingresos.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 8 }}>{r.factura}</td>
                      <td style={{ padding: 8 }}>{r.motivo}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>L{r.monto.toFixed(2)}</td>
                      <td style={{ padding: 8 }}>{new Date(r.fechaHora).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>{r.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 6px rgba(2,6,23,0.06)' }}>
          <h3 style={{ marginTop: 0 }}>Nuevo ingreso</h3>
          <form onSubmit={handleAdd} style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#475569' }}>Factura
              <input value={factura} onChange={e=>setFactura(e.target.value)} className="input" style={{ marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 13, color: '#475569' }}>Motivo
              <input value={motivo} onChange={e=>setMotivo(e.target.value)} className="input" style={{ marginTop: 6 }} required />
            </label>
            <label style={{ fontSize: 13, color: '#475569' }}>Monto
              <input value={monto} onChange={e=>setMonto(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="0.01" className="input" style={{ marginTop: 6 }} required />
            </label>
            <label style={{ fontSize: 13, color: '#475569' }}>Fecha y hora
              <input value={fechaHora} onChange={e=>setFechaHora(e.target.value)} type="datetime-local" className="input" style={{ marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 13, color: '#475569' }}>Usuario
              <input value={usuario} onChange={e=>setUsuario(e.target.value)} className="input" style={{ marginTop: 6 }} />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button type="submit" className="btn-primary">Agregar</button>
              <button type="button" onClick={() => { setFactura(''); setMotivo(''); setMonto(''); setFechaHora(new Date().toISOString().slice(0,16)) }} className="btn-opaque" style={{ background: 'transparent', color: '#2563eb' }}>Limpiar</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
