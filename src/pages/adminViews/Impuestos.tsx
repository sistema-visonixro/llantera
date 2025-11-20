import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'

type Impuesto = {
  id: number
  impuesto_venta?: string | null
}

const idToLabel: Record<number, string> = {
  1: 'Impuesto de venta',
  2: 'Impuesto 18%',
  3: 'Impuesto turístico'
}

export default function Impuestos() {
  const [items, setItems] = useState<Impuesto[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('impuesto').select('id, impuesto_venta').order('id', { ascending: true })
      if (error) throw error
      setItems(Array.isArray(data) ? data as Impuesto[] : [])
    } catch (e: any) {
      console.warn('Error cargando impuestos:', e)
      setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleChange = (id: number, value: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, impuesto_venta: value } : it))
  }

  const save = async (id: number) => {
    const row = items.find(i => i.id === id)
    if (!row) return
    setSavingId(id)
    setError(null)
    try {
      const payload: any = { impuesto_venta: row.impuesto_venta ?? null }
      const { error } = await supabase.from('impuesto').update(payload).eq('id', id)
      if (error) throw error
      await fetchAll()
    } catch (e: any) {
      console.warn('Error guardando impuesto:', e)
      setError(String(e.message || e))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <h2>Impuestos</h2>
      <p style={{ color: '#475569' }}>Edite los valores de impuestos. Solo se permite actualizar registros existentes.</p>

      {loading ? (<div>Cargando...</div>) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {items.map(it => (
            <div key={it.id} style={{ width: 300, borderRadius: 8, padding: 12, background: 'white', boxShadow: '0 6px 18px rgba(2,6,23,0.06)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{idToLabel[it.id] ?? `Impuesto #${it.id}`}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>ID: {it.id}</div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#334155' }}>Impuesto (porcentaje)</label>
                <input
                  type="text"
                  value={it.impuesto_venta ?? ''}
                  onChange={e => handleChange(it.id, e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  disabled={editingId !== it.id}
                />
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{editingId === it.id ? 'Ahora puede editar. ' : 'Pulse "Actualizar" para habilitar edición'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{savingId === it.id ? 'Guardando...' : ''}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editingId === it.id ? (
                    <>
                      <button onClick={() => { setEditingId(null); fetchAll() }} className="btn-opaque" style={{ background: 'transparent' }}>Cancelar</button>
                      <button onClick={() => save(it.id)} className="btn-opaque" disabled={savingId === it.id} style={{ opacity: savingId === it.id ? 0.6 : 1 }}>Guardar</button>
                    </>
                  ) : (
                    <button onClick={() => setEditingId(it.id)} className="btn-opaque">Actualizar</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ color: '#64748b' }}>No hay registros en la tabla `impuesto`.</div>
          )}
        </div>
      )}

      {error && <div style={{ marginTop: 12, color: 'red' }}>Error: {error}</div>}
    </div>
  )
}
