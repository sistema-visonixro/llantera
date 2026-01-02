# Configuración PWA (Progressive Web App)

## ✅ Cambios Realizados

### 1. **Service Worker** (`/public/sw.js`)

- Cachea recursos estáticos para funcionar offline
- Se registra automáticamente al cargar la aplicación

### 2. **Manifest** (`/public/manifest.json`)

- Configurado con nombre, iconos, colores del tema
- Modo `standalone` para que se vea como app nativa
- Actualizado dinámicamente con el logo de la empresa

### 3. **Iconos PWA**

- **Iconos placeholder**: `/public/icon-192.svg` y `/public/icon-512.svg`
- **Actualización dinámica**: El componente `PWAIconUpdater` reemplaza estos iconos con el logo de la empresa desde Supabase

### 4. **Componente PWAIconUpdater** (`/src/components/PWAIconUpdater.tsx`)

- Se ejecuta al cargar la app
- Obtiene el logo de la empresa desde Supabase
- Actualiza dinámicamente:
  - Manifest con el logo de la empresa
  - Favicon
  - Apple touch icon
  - Nombre de la empresa

### 5. **Meta Tags en index.html**

- Configurados para PWA (apple-mobile-web-app, theme-color, etc.)
- Viewport optimizado para tablets y móviles
- Service Worker se registra automáticamente

## 📱 Cómo Instalar la PWA

### En Chrome/Edge (Desktop):

1. Abrir la aplicación en el navegador
2. Buscar el ícono de instalación en la barra de direcciones (⊕)
3. Clic en "Instalar"

### En Chrome/Safari (Android/iOS):

1. Abrir la aplicación en el navegador
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. Confirmar instalación

### En tablets:

1. La barra de navegación ya no tapará el header (ahora es sticky)
2. La app se puede instalar como cualquier otra aplicación

## 🎨 Logo de la Empresa

El logo se obtiene automáticamente de:

- Tabla: `empresa` en Supabase
- Campo: `logo` (debe ser una URL o path en el storage de Supabase)
- Bucket: `logo` en Supabase Storage

El componente `PWAIconUpdater` se encarga de:

1. Obtener el logo usando `getCompanyData()`
2. Actualizar todos los iconos de la PWA con ese logo
3. Actualizar el manifest dinámicamente con el nombre de la empresa

## 🔧 Configuración Manual de Iconos (Opcional)

Si prefieres crear iconos PNG estáticos basados en el logo de la empresa:

```bash
# Instalar dependencias (solo si quieres generar PNG)
npm install canvas

# Ejecutar script de generación (necesita estar completo)
node scripts/generate-pwa-icons.mjs
```

Este script descargará el logo de Supabase y generará:

- `/public/icon-192.png`
- `/public/icon-512.png`

## ✨ Características PWA Habilitadas

- ✅ Instalable en dispositivos móviles y desktop
- ✅ Iconos dinámicos basados en logo de empresa
- ✅ Service Worker para cache offline
- ✅ Modo standalone (sin barra del navegador)
- ✅ Theme color personalizado (#1e293b)
- ✅ Responsive en tablets y móviles
- ✅ Header sticky que no se tapa con la barra del navegador

## 🔍 Verificar PWA

Para verificar que la PWA está correctamente configurada:

1. **Chrome DevTools**:

   - F12 → Application → Manifest
   - F12 → Application → Service Workers
   - F12 → Lighthouse → Progressive Web App

2. **Probar instalación**:
   - Abrir en HTTPS (requerido para PWA)
   - Verificar que aparezca el botón de instalar
   - Instalar y probar como app standalone

## 📝 Notas

- La PWA **requiere HTTPS** en producción
- En desarrollo (localhost) funciona sin HTTPS
- El Service Worker puede tardar en actualizarse (cierra todas las pestañas)
- Los iconos se actualizan automáticamente con el logo de la empresa
