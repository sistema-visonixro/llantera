import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sqwqlvsjtimallidxrsz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxd3FsdnNqdGltYWxsaWR4cnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjM4NTYsImV4cCI6MjA3ODk5OTg1Nn0.5s_2Dz76gha9Zb-0RPzJ_vBz-TTP6zHrNyAugBpxnEQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  try {
    const { data, error } = await supabase.from('users').select('id, username, role')
    if (error) {
      console.error('Query error:', error.message || error)
      process.exit(2)
    }
    console.log('Rows:', Array.isArray(data) ? data.length : 0)
    console.dir(data, { depth: 3 })
  } catch (err) {
    console.error('Unexpected error', err)
    process.exit(3)
  }
}

test()
