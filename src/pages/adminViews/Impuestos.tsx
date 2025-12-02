import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'
import { Edit, Save, X, Check } from 'lucide-react'

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
  const [editValue, setEditValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

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

  const startEditing = (item: Impuesto) => {
    setEditingId(item.id)
    setEditValue(item.impuesto_venta || '')
    setError(null)
    setSuccessMsg(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditValue('')
    setError(null)
  }

  const save = async (id: number) => {
    // Validation: check if it's a valid number
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      setError('Por favor ingrese un valor numérico válido (ej. 0.15)')
      return
    }

    setSavingId(id)
    setError(null)
    setSuccessMsg(null)
    try {
      const payload = { impuesto_venta: editValue }
      const { error } = await supabase.from('impuesto').update(payload).eq('id', id)
      if (error) throw error

      setSuccessMsg('Impuesto actualizado correctamente')
      setEditingId(null)
      await fetchAll()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (e: any) {
      console.warn('Error guardando impuesto:', e)
      setError(String(e.message || e))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Impuestos</h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Administre los porcentajes de impuestos del sistema.
      </p>

      {error && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: '#fef2f2',
          color: '#b91c1c',
          borderRadius: 6,
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: '#f0fdf4',
          color: '#15803d',
          borderRadius: 6,
          border: '1px solid #bbf7d0'
        }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#64748b' }}>Cargando datos...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Descripción</th>
                <th style={{ width: 200 }}>Valor (Decimal)</th>
                <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isEditing = editingId === item.id
                const isSaving = savingId === item.id

                return (
                  <tr key={item.id}>
                    <td style={{ color: '#64748b' }}>{item.id}</td>
                    <td style={{ fontWeight: 500 }}>
                      {idToLabel[item.id] ?? `Impuesto Desconocido #${item.id}`}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="input"
                          style={{ padding: '6px 10px', width: '100%', maxWidth: 150 }}
                          placeholder="0.00"
                          autoFocus
                          disabled={isSaving}
                          onKeyDown={e => {
                            if (e.key === 'Enter') save(item.id)
                            if (e.key === 'Escape') cancelEditing()
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: 14 }}>
                          {item.impuesto_venta ?? '-'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={cancelEditing}
                              className="btn-opaque"
                              style={{ background: '#f1f5f9', color: '#475569', padding: 6 }}
                              title="Cancelar"
                              disabled={isSaving}
                            >
                              <X size={16} />
                            </button>
                            <button
                              onClick={() => save(item.id)}
                              className="btn-primary"
                              style={{ padding: 6 }}
                              title="Guardar"
                              disabled={isSaving}
                            >
                              {isSaving ? <span style={{ fontSize: 12 }}>...</span> : <Check size={16} />}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditing(item)}
                            className="btn-opaque"
                            style={{ background: 'transparent', color: '#64748b', padding: 6, border: '1px solid #e2e8f0' }}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No se encontraron registros de impuestos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
