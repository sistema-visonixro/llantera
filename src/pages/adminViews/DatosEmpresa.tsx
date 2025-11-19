import React, { useEffect, useState } from 'react'

export default function DatosEmpresa() {
  const [company, setCompany] = useState<any | null>(null)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setCompanyLoading(true)
      try {
        const sup = (await import('../../lib/supabaseClient')).default
        const { data, error } = await sup.from('empresa').select('*').limit(1).single()
        if (!mounted) return
        if (error) throw error
        if (data) {
          setCompany(data)
          setEditForm(data)
          try { localStorage.setItem('companyData', JSON.stringify(data)) } catch {}
          setCompanyLoading(false)
          return
        }
      } catch (err) {
        console.debug('No se pudo cargar empresa desde Supabase, fallback a JSON/localStorage', err)
      }

      try {
        const stored = localStorage.getItem('companyData')
        if (stored) {
          setCompany(JSON.parse(stored))
          setEditForm(JSON.parse(stored))
          setCompanyLoading(false)
          return
        }
      } catch {}

      try {
        const res = await fetch('/data-base/company.json')
        if (!res.ok) throw new Error('no json')
        const d = await res.json()
        if (!mounted) return
        setCompany(d)
        setEditForm(d)
      } catch {
        if (mounted) setCompany(null)
      } finally {
        if (mounted) setCompanyLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => { if (company) setEditForm(company) }, [company])

  function startEdit() { setEditing(true); setEditForm(company || {}) }
  function cancelEdit() { setEditing(false); setEditForm(company || {}) }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) { const { name, value } = e.target; setEditForm((s: any) => ({ ...s, [name]: value })) }

  async function saveCompany() {
    try {
      const sup = (await import('../../lib/supabaseClient')).default
      const payload = { ...(editForm || {}) }
      let result: any = null
      if (company && company.id) {
        const { data, error } = await sup.from('empresa').update(payload).eq('id', company.id).select().single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await sup.from('empresa').insert(payload).select().single()
        if (error) throw error
        result = data
      }

      setCompany(result)
      setEditForm(result)
      try { localStorage.setItem('companyData', JSON.stringify(result)) } catch {}
      setEditing(false)
      alert('Datos de la empresa guardados correctamente')
    } catch (err: any) {
      console.error('Error guardando empresa en Supabase', err)
      try { setCompany(editForm); localStorage.setItem('companyData', JSON.stringify(editForm)); setEditing(false); alert('Guardado localmente (no se pudo alcanzar Supabase)') } catch {}
    }
  }

  function resetToJson() { fetch('/data-base/company.json').then(r => r.json()).then(d => { setCompany(d); setEditForm(d); localStorage.removeItem('companyData') }).catch(() => {}) }

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Datos de mi empresa</h2>
      {companyLoading ? (
        <div>Cargando datos de la empresa...</div>
      ) : !company ? (
        <div>No se encontraron datos de la empresa.</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ background: '#fff', padding: 18, borderRadius: 8, minWidth: 420, boxShadow: '0 1px 3px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 120, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <img src={editing ? (editForm.logo || '/logo192.png') : (company.logo || '/logo192.png')} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <h3 style={{ marginTop: 0 }}>{company.nombre}</h3>
            </div>
            <div style={{ marginTop: 8, color: '#334155' }}>
              <div style={{ marginBottom: 8 }}><strong>RTN:</strong> {editing ? (
                <input name="rtn" value={editForm.rtn || ''} onChange={handleChange} className="input" />
              ) : company.rtn}</div>
              <div style={{ marginBottom: 8 }}><strong>Teléfono:</strong> {editing ? (
                <input name="telefono" value={editForm.telefono || ''} onChange={handleChange} className="input" />
              ) : company.telefono}</div>
              <div style={{ marginBottom: 8 }}><strong>Correo:</strong> {editing ? (
                <input name="email" value={editForm.email || ''} onChange={handleChange} className="input" />
              ) : company.email}</div>
              <div style={{ marginBottom: 8 }}><strong>Dirección:</strong> {editing ? (
                <textarea name="direccion" value={editForm.direccion || ''} onChange={handleChange} className="input" style={{ minHeight: 64 }} />
              ) : company.direccion}</div>
              <div style={{ marginBottom: 8 }}><strong>Logo (URL):</strong> {editing ? (
                <input name="logo" value={editForm.logo || ''} onChange={handleChange} className="input" placeholder="https://.../logo.png" />
              ) : (<span style={{ marginLeft: 6 }}>{company.logo ? 'URL configurada' : 'No hay logo'}</span>)}</div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {editing ? (
                <>
                  <button type="button" onClick={saveCompany} className="btn-primary">Guardar</button>
                  <button type="button" onClick={cancelEdit} className="btn-opaque">Cancelar</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={startEdit} className="btn-primary">Actualizar datos</button>
                  <button type="button" onClick={resetToJson} className="btn-opaque">Restaurar valores</button>
                </>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 220, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                <img
                  src={editing ? (editForm.logo || '/logo192.png') : (company.logo || '/logo192.png')}
                  alt="logo"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
              <h4 style={{ margin: 0, marginBottom: 8 }}>Detalles rápidos</h4>
              <p style={{ margin: 0 }}>RTN: <strong>{company.rtn}</strong></p>
              <p style={{ margin: 0 }}>Teléfono: <strong>{company.telefono}</strong></p>
              <p style={{ marginTop: 8 }}>Correo: <strong>{company.email}</strong></p>
              <p style={{ marginTop: 8 }}>Dirección: <strong>{company.direccion}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
