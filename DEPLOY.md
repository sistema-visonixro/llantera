# Deploy / Producción

Instrucciones para publicar el proyecto en diferentes plataformas.

---

## Deploy en Vercel

### 1. Configurar variables de entorno en Vercel

Ve a tu proyecto en Vercel → **Settings → Environment Variables** y añade:

- `VITE_SUPABASE_URL` → Tu URL de Supabase (ej: `https://sqwqlvsjtimallidxrsz.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` → Tu clave pública/anon key de Supabase
- `VITE_SUPABASE_STORAGE_BUCKET` → Nombre del bucket (ej: `inventario`)

**Importante:** Asegúrate de que estas variables estén disponibles para **Production, Preview y Development**.

### 2. Redeploy

Después de añadir las variables de entorno:
- Ve a **Deployments**
- Selecciona el último deployment
- Haz clic en el menú ⋯ (tres puntos)
- Selecciona **Redeploy**

---

## Deploy en GitHub Pages

### 1. Añadir secretos en GitHub

- Ve a `Settings -> Secrets and variables -> Actions` de tu repositorio y añade estos secrets:
  - `VITE_SUPABASE_URL` (ej: `https://<project>.supabase.co`)
  - `VITE_SUPABASE_ANON_KEY` (anon/public key)
  - `VITE_SUPABASE_STORAGE_BUCKET` (ej: `inventario`)

### 2. Flujo automático (ya incluido)

- El archivo `.github/workflows/deploy.yml` está incluido y se dispara al hacer push a `main`.
- El workflow ejecuta `npm ci`, `npm run build` con las variables anteriores y publica `dist/` en la rama `gh-pages`.

### 3. Habilitar GitHub Pages

- Después del primer despliegue, ve a `Settings -> Pages` y pon que sirva desde la rama `gh-pages` (carpeta `/`).

### 4. CORS / Storage

- Si las imágenes no se muestran en producción revisa la consola `Network` y `Console` en el navegador.
- Para pruebas rápidas deja el bucket `inventario` como _Public_ en Supabase Storage para que `getPublicUrl` devuelva URLs válidas.
- Si mantienes el bucket `Private`, la app intentará usar `createSignedUrl` para generar URLs temporales (la app necesita las credenciales en tiempo de ejecución para solicitar signed URLs — en este repo el cliente usa la anon key; con buckets privados normalmente se recomienda generar signed URLs desde un backend seguro).

### 5. Notas de seguridad

- Nunca publiques claves de servicio (`service_role`) en el frontend. El `anon` key está pensado para operaciones cliente públicas y tiene restricciones según tus políticas RLS.

### 6. Comandos para push manual

- Para activar el workflow manualmente:

```bash
git add .github/workflows/deploy.yml DEPLOY.md
git commit -m "Add GH Pages deploy workflow and deploy notes"
git push origin main
```

Luego revisa la pestaña `Actions` en GitHub para seguir el build y el despliegue.

---

## Solución de problemas comunes

### Error: "Falta configuración de Supabase"

**Causa:** Las variables de entorno no están configuradas en la plataforma de deploy.

**Solución:**
- **Vercel:** Añade las variables en Settings → Environment Variables
- **GitHub Pages:** Añade los secrets en Settings → Secrets and variables → Actions
- Después de añadirlas, haz un nuevo deployment

### La app se ve en blanco

1. Abre la consola del navegador (F12)
2. Busca errores relacionados con Supabase o variables de entorno
3. Verifica que las variables estén correctamente configuradas en tu plataforma
4. Haz un redeploy después de configurar las variables

### Verificar que las variables están disponibles

En Vercel, después de añadir las variables:
1. Ve a Settings → Environment Variables
2. Verifica que las tres variables tengan valores en los tres ambientes (Production, Preview, Development)
3. Si falta alguna, añádela
4. Haz redeploy
