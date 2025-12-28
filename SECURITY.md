# 🔒 Configuración de Variables de Entorno

## ⚙️ Setup Inicial

Las credenciales de Supabase ahora se gestionan de forma segura mediante variables de entorno.

### 1. Crear archivo .env

Copia el archivo de ejemplo y completa con tus credenciales:

```bash
cp .env.example .env
```

### 2. Configurar credenciales

Edita el archivo `.env` y agrega tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_SUPABASE_STORAGE_BUCKET=tu_bucket_name
```

## 🛡️ Seguridad

- ✅ El archivo `.env` está en `.gitignore` y **nunca debe subirse a Git**
- ✅ Usa `.env.example` como plantilla (sin valores reales)
- ✅ En producción, configura las variables de entorno en tu plataforma de hosting
- ✅ Para CI/CD, usa GitHub Secrets (ya configurado en `.github/workflows/deploy.yml`)

## 📝 Archivos Actualizados

- `src/lib/supabaseClient.ts` - Cliente principal (sin credenciales hard-coded)
- `scripts/test_supabase_users.mjs` - Script de prueba (usa dotenv)
- `.env` - Credenciales locales (ignorado por Git)
- `.env.example` - Plantilla pública

## 🚀 Ejecutar el Proyecto

```bash
# Desarrollo
npm run dev

# Scripts Node.js (usan dotenv automáticamente)
node scripts/test_supabase_users.mjs
```

## ⚠️ Importante

Si ves el error `Falta configuración de Supabase`, verifica que:

1. Existe el archivo `.env` en la raíz del proyecto
2. Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están definidas
3. El servidor de desarrollo está reiniciado
