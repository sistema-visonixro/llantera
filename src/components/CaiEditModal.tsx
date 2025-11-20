import React, { useEffect, useState } from 'react'

type CaiRow = {
  id: number
  cai: string
  rango_de?: string | null
  rango_hasta?: string | null
  fecha_vencimiento?: string | null
  caja?: number | null
  cajero?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  row: CaiRow | null
  cajeros: Array<{ id: number; username: string; nombre_usuario?: string }>
  availableCajeros?: Array<{ id: number; username: string; nombre_usuario?: string }>
  availableCajas?: number[]
  onSave: (id: number, payload: { caja: number | null; cajero?: string | null }) => Promise<void>
}

export default function CaiEditModal({ open, onClose, row, cajeros, availableCajeros, availableCajas, onSave }: Props) {
  const [cajeroId, setCajeroId] = useState<number | null>(null)
  const [cajeroUsername, setCajeroUsername] = useState<string | null>(null)
  const [isCustom, setIsCustom] = useState(false)
  const [caja, setCaja] = useState<number | null>(null)
  const [caiValue, setCaiValue] = useState<string>('')
  const [rangoDe, setRangoDe] = useState<string>('')
  const [rangoHasta, setRangoHasta] = useState<string>('')
  const [fechaVenc, setFechaVenc] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (!row) return
    setCaja(row.caja ?? null)
    setCaiValue(row.cai ?? '')
    setRangoDe(row.rango_de ?? '')
    setRangoHasta(row.rango_hasta ?? '')
    setFechaVenc(row.fecha_vencimiento ?? '')
    // Determine if the current cajero matches a known user
    const current = row.cajero ?? null
    if (current) {
      const match = cajeros.find(c => c.username === current || c.nombre_usuario === current)
      if (match) {
        setCajeroId(match.id)
        setCajeroUsername(null)
        setIsCustom(false)
      } else {
        setCajeroId(null)
        setCajeroUsername(current)
        setIsCustom(true)
      }
    } else {
      setCajeroId(null)
      setCajeroUsername(null)
      setIsCustom(false)
    }
    setError(null)
  }, [open, row, cajeros])

  if (!open || !row) return null

  async function handleSave() {
    if (!row) {
      setError('Registro inválido')
      return
    }
    if (caja != null && (caja < 1 || caja > 5)) {
      setError('La caja debe estar entre 1 y 5')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        cai: caiValue ?? null,
        rango_de: rangoDe ?? null,
        rango_hasta: rangoHasta ?? null,
        fecha_vencimiento: fechaVenc ?? null,
        caja: caja ?? null,
      }
      if (cajeroId != null) {
        const sel = cajeros.find(c => c.id === cajeroId)
        payload.cajero = sel ? sel.username : null
      } else {
        payload.cajero = cajeroUsername ?? null
      }
      await onSave(row.id, payload)
      onClose()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ width: 720, maxWidth: '95%', background: '#fff', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Editar CAI — ID {row.id}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>CAI</label>
            <input className="input" value={caiValue} onChange={e => setCaiValue(e.target.value)} />
            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Rango Desde</label>
            <input className="input" value={rangoDe} onChange={e => setRangoDe(e.target.value)} />
            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Rango Hasta</label>
            <input className="input" value={rangoHasta} onChange={e => setRangoHasta(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Fecha de Vencimiento</label>
            <input className="input" type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} />

            <label style={{ display: 'block', marginTop: 12, marginBottom: 6 }}>Cajero</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                className="input"
                style={{ minHeight: 36, minWidth: 200 }}
                value={cajeroId != null ? String(cajeroId) : (isCustom ? '__custom__' : '')}
                onChange={e => {
                  const val = e.target.value
                  if (val === '') {
                    setCajeroId(null)
                    setCajeroUsername(null)
                    setIsCustom(false)
                  } else if (val === '__custom__') {
                    setCajeroId(null)
                    setIsCustom(true)
                  } else if (/^\d+$/.test(val)) {
                    setCajeroId(Number(val))
                    setCajeroUsername(null)
                    setIsCustom(false)
                  }
                }}
              >
                <option value="">-- sin asignar --</option>
                {(availableCajeros ?? cajeros).map(c => (
                  <option key={c.id} value={String(c.id)}>{c.username}{c.nombre_usuario ? ` — ${c.nombre_usuario}` : ''}</option>
                ))}
                <option value="__custom__">-- personalizado --</option>
              </select>
              {isCustom && (
                <input className="input" placeholder="Nombre de cajero" value={cajeroUsername ?? ''} onChange={e => { setCajeroUsername(e.target.value); setCajeroId(null) }} style={{ minHeight: 36 }} />
              )}

              <div style={{ marginLeft: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Caja</label>
                <select className="input" style={{ minHeight: 36, minWidth: 120 }} value={caja ?? '' as any} onChange={e => setCaja(e.target.value === '' ? null : Number(e.target.value))}>
                  <option value="">-- sin asignar --</option>
                  {(availableCajas ?? [1,2,3,4,5]).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn-opaque" onClick={onClose} disabled={saving} style={{ width: 'auto' }}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: 'auto', padding: '8px 14px' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}
