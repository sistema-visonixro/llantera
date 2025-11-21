import supabase from './supabaseClient'

export async function getCompanyData() {
  try {
    const { data, error } = await supabase.from('empresa').select('*').limit(1).maybeSingle()
    if (error) throw error
    const company = data || null
    if (!company) return null

    // Resolve logo public URL using Supabase storage (try public URL first, then signed URL)
    try {
      const v = company.logo
      if (!v) {
        company.logoUrl = null
      } else if (String(v).startsWith('http')) {
        company.logoUrl = String(v)
      } else {
        const BUCKET = 'logo'
        try {
          const publicRes = await supabase.storage.from(BUCKET).getPublicUrl(String(v))
          const publicUrl = (publicRes as any)?.data?.publicUrl ?? null
          if (publicUrl) {
            company.logoUrl = publicUrl
          } else {
            const signed = await supabase.storage.from(BUCKET).createSignedUrl(String(v), 60 * 60)
            company.logoUrl = (signed as any)?.data?.signedUrl ?? null
          }
        } catch (e) {
          // Fallback to composing a public URL if storage API fails
          const SUP_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://sqwqlvsjtimallidxrsz.supabase.co'
          let obj = String(v)
          if (obj.startsWith(`${BUCKET}/`)) obj = obj.slice(BUCKET.length + 1)
          company.logoUrl = `${SUP_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(obj)}`
        }
      }
    } catch (e) {
      company.logoUrl = null
    }

    return company
  } catch (e) {
    console.warn('getCompanyData error', e)
    return null
  }
}

export default getCompanyData
