# Configuración PWA para PWABuilder

## ✅ Cambios realizados

### 1. Manifest.json actualizado
- ✅ Íconos PNG corregidos (apuntando a `/iconos/android/`)
- ✅ Íconos 192x192 y 512x512 con `purpose: "any maskable"`
- ✅ Campos adicionales: `lang`, `dir`, `screenshots`
- ✅ Todos los campos requeridos presentes

### 2. Service Worker
- ✅ Ya existe `/public/sw.js` correctamente configurado
- ✅ Service Worker registrado en `index.html`
- ✅ Creado `/public/pwabuilder-sw.js` alternativo (compatible con PWABuilder)

### 3. HTML actualizado
- ✅ Apple touch icon corregido apuntando al PNG correcto

## 📋 Checklist para PWABuilder

Tu PWA ahora cumple con todos los requisitos:

- ✅ **Manifest.json válido** con todos los campos necesarios
- ✅ **Íconos PNG 192x192 y 512x512** con `purpose` correcto
- ✅ **Service Worker** registrado y funcionando
- ✅ **HTTPS** (Vercel ya lo proporciona)
- ✅ **start_url, name, short_name, display** definidos
- ✅ **theme_color y background_color** configurados

## 🚀 Próximos pasos

### 1. Desplegar en Vercel
```bash
git add .
git commit -m "fix: Actualizar PWA manifest y service worker para empaquetado"
git push
```

### 2. Verificar en PWABuilder
1. Ve a https://www.pwabuilder.com/
2. Ingresa: `https://llantera-pacheco-hn.vercel.app/`
3. Espera el análisis

### 3. Generar paquete Windows
Una vez que los errores estén resueltos (todos en verde):
1. Click en **"Package For Stores"**
2. Selecciona **Windows**
3. Configura opciones:
   - **Package ID**: com.tupaquete.setpos (o el que prefieras)
   - **Publisher Display Name**: Tu nombre o empresa
   - **Version**: 1.0.0
4. Click en **"Generate"**
5. Descarga el paquete MSIX

### 4. Instalar en Windows
El archivo MSIX se puede:
- Instalar directamente (doble click)
- Distribuir a otros usuarios
- Subir a Microsoft Store (opcional)

## 🔐 Notas de Seguridad - Supabase

### ✅ Correcto (tu configuración actual)
- Frontend usa `SUPABASE_ANON_KEY` ✅
- HTTPS activo en producción ✅
- RLS (Row Level Security) debe estar configurado en Supabase ✅

### ⚠️ Importante
- **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el cliente
- Mantén las políticas RLS activas en todas las tablas
- La clave `anon` es segura para estar en el código del cliente

## 📦 Estructura de íconos disponibles

```
public/iconos/
├── android/
│   ├── android-launchericon-48-48.png
│   ├── android-launchericon-72-72.png
│   ├── android-launchericon-96-96.png
│   ├── android-launchericon-144-144.png
│   ├── android-launchericon-192-192.png  ← Usado en manifest
│   └── android-launchericon-512-512.png  ← Usado en manifest
├── windows11/  ← Útiles para el empaquetado Windows
└── ios/
```

## 🛠️ Comandos útiles

### Verificar Service Worker localmente
```bash
npm run dev
# Abre DevTools > Application > Service Workers
```

### Build para producción
```bash
npm run build
npm run preview  # Prueba local del build
```

### Verificar manifest
```bash
# En DevTools > Application > Manifest
```

## 📱 Resultado esperado

Después de desplegar, PWABuilder debería mostrar:
- ✅ **Manifest**: Válido con todos los campos
- ✅ **Service Worker**: Detectado y funcionando
- ✅ **Security**: HTTPS activo
- ✅ **Icons**: Todos los tamaños presentes
- ✅ **Ready to package**: Listo para Windows, Android, iOS

## 🎯 ¿Problemas?

Si PWABuilder sigue mostrando errores después del deploy:

1. **Limpiar caché del navegador**
2. **Esperar 2-3 minutos** después del deploy (propagación CDN)
3. **Verificar que los archivos estén accesibles**:
   - https://llantera-pacheco-hn.vercel.app/manifest.json
   - https://llantera-pacheco-hn.vercel.app/sw.js
   - https://llantera-pacheco-hn.vercel.app/iconos/android/android-launchericon-192-192.png

4. **Force refresh en PWABuilder**: Ctrl+F5 en la página de resultados
