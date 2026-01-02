# 🚀 Sistema de Actualización Automática de Versiones

Este sistema permite notificar automáticamente a los usuarios de PWA cuando hay una nueva versión disponible.

## 📋 Cómo funciona

1. **Verificación periódica**: El componente `VersionChecker` verifica cada 5 minutos si hay una nueva versión
2. **Detección de cambios**: Compara la versión local (localStorage) con la versión en el servidor (`/version.json`)
3. **Notificación visual**: Muestra un modal bonito cuando hay actualización disponible
4. **Actualización forzada**: Limpia el cache del service worker y recarga la aplicación

## 🔄 Proceso de actualización para desarrolladores

### Opción 1: Usando el script automatizado

```bash
# Actualización patch (1.0.0 -> 1.0.1)
./scripts/update-version.sh patch "Corrección de errores menores"

# Actualización minor (1.0.1 -> 1.1.0)
./scripts/update-version.sh minor "Nuevas funcionalidades agregadas"

# Actualización major (1.1.0 -> 2.0.0)
./scripts/update-version.sh major "Cambios importantes en la arquitectura"
```

El script:
- ✅ Incrementa automáticamente la versión
- ✅ Actualiza la fecha de build
- ✅ Guarda el mensaje del changelog
- ✅ Te indica el siguiente comando git a ejecutar

### Opción 2: Actualización manual

Edita `public/version.json`:

```json
{
  "version": "1.0.1",
  "buildDate": "2026-01-02T00:00:00.000Z",
  "changelog": "Descripción de los cambios"
}
```

## 📦 Flujo completo de deploy

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "Feature: Nueva funcionalidad"

# 2. Actualizar versión
./scripts/update-version.sh patch "Nueva funcionalidad agregada"

# 3. Commitear la nueva versión
git add public/version.json
git commit -m "v1.0.1: Nueva funcionalidad agregada"

# 4. Push a GitHub (Vercel detectará y desplegará automáticamente)
git push origin main
```

## 🎯 Qué sucede después del deploy

1. **Vercel despliega** la nueva versión automáticamente
2. **VersionChecker detecta** la nueva versión en la próxima verificación (máx 5 minutos)
3. **Usuario ve notificación** con el mensaje del changelog
4. **Usuario actualiza** y obtiene la última versión

## ⚙️ Configuración

### Cambiar el intervalo de verificación

En `src/components/VersionChecker.tsx`:

```typescript
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos (en milisegundos)
```

### Personalizar el modal de actualización

El componente `VersionChecker.tsx` incluye estilos CSS inline que puedes modificar.

## 📱 Comportamiento en PWA

- ✅ Limpia **todos los caches** del service worker
- ✅ **Desregistra** los service workers antiguos
- ✅ Fuerza **recarga desde el servidor**
- ✅ Actualiza la **versión en localStorage**

## 🔧 Troubleshooting

### Los usuarios no ven la actualización

1. Verifica que `version.json` se haya actualizado en producción
2. Asegúrate de que Vercel completó el deploy
3. Los usuarios verán la notificación en máximo 5 minutos

### La PWA no se actualiza correctamente

El componente `VersionChecker` limpia automáticamente:
- Todos los caches del navegador
- Todos los service workers registrados
- Fuerza recarga completa

### Quiero forzar actualización inmediata

Ejecuta en la consola del navegador:

```javascript
localStorage.setItem('app_current_version', '0.0.0');
location.reload();
```

## 📝 Notas importantes

- ⚠️ **Siempre actualiza la versión** antes de hacer push
- 💡 Usa mensajes de changelog descriptivos
- 🎯 Los usuarios pueden "posponer" actualizaciones (botón "Más tarde")
- 🔄 La versión se verifica automáticamente en segundo plano

## 🚦 Tipos de versiones

- **MAJOR** (X.0.0): Cambios incompatibles, rediseños completos
- **MINOR** (0.X.0): Nuevas funcionalidades compatibles
- **PATCH** (0.0.X): Correcciones de errores, mejoras menores

---

**Desarrollado para**: Sistema de gestión Llantera PWA  
**Fecha**: Enero 2026
