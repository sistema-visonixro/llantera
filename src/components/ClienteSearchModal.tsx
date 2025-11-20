import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

type Cliente = {
  id: number
  nombre: string
  rtn?: string
  telefono?: string
  correo_electronico?: string
  tipo_cliente?: string
  exonerado?: boolean
}

export default function ClienteSearchModal({ open, onClose, onSelect }:
  { open: boolean, onClose: () => void, onSelect: (c: Cliente) => void }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    if (!open) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('clientes').select('id,nombre,rtn,telefono,correo_electronico,tipo_cliente,exonerado').order('id', { ascending: false }).limit(100)
        if (error) throw error
        if (mounted) setClientes(Array.isArray(data) ? data as Cliente[] : [])
      } catch (e) {
        console.warn('Error cargando clientes:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const q = String(query || '').trim()
        let res
        if (q === '') {
          res = await supabase.from('clientes').select('id,nombre,rtn,telefono,correo_electronico,tipo_cliente,exonerado').order('id', { ascending: false }).limit(100)
        } else {
          // buscar por nombre o rtn (case-insensitive)
          res = await supabase.from('clientes').select('id,nombre,rtn,telefono,correo_electronico,tipo_cliente,exonerado').or(`nombre.ilike.%${q}%,rtn.ilike.%${q}%`).order('id', { ascending: false }).limit(100)
        }
        if (res.error) throw res.error
        setClientes(Array.isArray(res.data) ? res.data as Cliente[] : [])
      } catch (e) {
        console.warn('Error buscando clientes:', e)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, open])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ width: 820, maxWidth: '95%', maxHeight: '80vh', overflow: 'auto', background: 'white', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Buscar Cliente</h3>
          <button onClick={onClose} className="btn-opaque">Cerrar</button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o RTN..." style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }} />
          <div style={{ minWidth: 100, textAlign: 'right' }}>{loading ? 'Cargando...' : `${clientes.length} encontrados`}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>RTN</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Nombre / Razón social</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Teléfono</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Correo</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={String(c.id)} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{c.rtn}</td>
                  <td style={{ padding: 8 }}>{c.nombre}</td>
                  <td style={{ padding: 8 }}>{c.telefono}</td>
                  <td style={{ padding: 8 }}>{c.correo_electronico}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => { onSelect(c); onClose() }} className="btn-opaque">Seleccionar</button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && !loading && (
                <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>No hay clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
