import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Leer credenciales desde variables de entorno (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Falta configuración de Supabase. Asegúrate de tener un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // No persistir sesión por defecto en este cliente de lectura/escritura en frontend
      persistSession: false,
    },
  }
);

export default supabase;
