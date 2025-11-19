import React, { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  table: string
  select?: string // supabase select string, e.g. 'id, username, email'
  title?: string
  limit?: number
  columns?: string[] // optional explicit column order/names to show
  searchColumns?: string[] // columns to search on
}

export default function SupabaseTable({ table, select, title, limit = 500, columns, searchColumns }: Props) {
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const mountedRef = useRef(true)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const sup = (await import('../lib/supabaseClient')).default
      const sel = select || '*'
      const res = await sup.from(table).select(sel).limit(limit)
      console.debug('SupabaseTable fetch result for', table, res)
      if (!mountedRef.current) return
      if (res.error) throw res.error
      setData(Array.isArray(res.data) ? res.data : [])
    } catch (err: any) {
      console.error('SupabaseTable error', err)
      setError(err?.message || String(err))
      setData([])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => { mountedRef.current = false }
  }, [table, select, limit])

  const displayedColumns = useMemo(() => {
    if (columns && columns.length > 0) return columns
    if (!data || data.length === 0) return []
    // take keys from first item
    return Object.keys(data[0])
  }, [columns, data])

  const filtered = useMemo(() => {
    if (!data) return null
    const q = (query || '').toString().trim().toLowerCase()
    if (!q) return data
    const cols = (searchColumns && searchColumns.length > 0) ? searchColumns : displayedColumns
    return data.filter(row => cols.some(c => {
      const v = row?.[c]
      if (v == null) return false
      return String(v).toLowerCase().includes(q)
    }))
  }, [data, query, searchColumns, displayedColumns])

  return (
    <div style={{ padding: 18 }}>
      {title ? <h2 style={{ marginTop: 0 }}>{title}</h2> : null}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} className="input" style={{ minWidth: 240 }} />
        <button onClick={() => { setError(null); setQuery(''); fetchData(); }} className="btn-opaque">Recargar</button>
      </div>

      {loading && <div>Cargando datos de `{table}` desde Supabase...</div>}
      {error && <div style={{ color: '#b91c1c' }}>Error: {error}</div>}

      {!loading && data && data.length === 0 && (
        <div>No hay registros en la tabla <strong>{table}</strong>.</div>
      )}

      {!loading && filtered && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                {displayedColumns.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  {displayedColumns.map(col => (
                    <td key={col} style={{ maxWidth: 420, wordBreak: 'break-word' }}>{formatCell(row[col])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatCell(v: any) {
  if (v == null) return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
