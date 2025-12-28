import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env"
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, role");
    if (error) {
      console.error("Query error:", error.message || error);
      process.exit(2);
    }
    console.log("Rows:", Array.isArray(data) ? data.length : 0);
    console.dir(data, { depth: 3 });
  } catch (err) {
    console.error("Unexpected error", err);
    process.exit(3);
  }
}

test();
