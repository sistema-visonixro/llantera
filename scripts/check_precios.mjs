import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sqwqlvsjtimallidxrsz.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxd3FsdnNqdGltYWxsaWR4cnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjM4NTYsImV4cCI6MjA3ODk5OTg1Nn0.5s_2Dz76gha9Zb-0RPzJ_vBz-TTP6zHrNyAugBpxnEQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  try {
    const { data, error, count } = await supabase.from('precios').select('id, producto_id, precio', { count: 'exact', head: false }).limit(200)
    if (error) {
      console.error('Error querying precios:', error)
      process.exit(1)
    }
    console.log('Total rows fetched:', Array.isArray(data) ? data.length : 0)
    if (Array.isArray(data)) {
      for (let i = 0; i < Math.min(30, data.length); i++) {
        const row = data[i]
        console.log(i, 'id=', row.id, 'producto_id=', row.producto_id, 'tipo(producto_id)=', typeof row.producto_id, 'precio=', row.precio)
      }
    }
      console.log('\n-- Checking inventario ids --')
      const { data: inv, error: invErr } = await supabase.from('inventario').select('id, sku, nombre').limit(50)
      if (invErr) {
        console.error('Error querying inventario:', invErr)
        process.exit(1)
      }
      console.log('Inventario rows fetched:', Array.isArray(inv) ? inv.length : 0)
      if (Array.isArray(inv)) {
        for (let i = 0; i < Math.min(20, inv.length); i++) {
          const r = inv[i]
          console.log(i, 'inv.id=', r.id, 'type=', typeof r.id, 'sku=', r.sku, 'nombre=', r.nombre)
        }
      }
  } catch (e) {
    console.error('Fatal', e)
    process.exit(1)
  }
}

main()
