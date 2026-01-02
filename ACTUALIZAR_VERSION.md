# 🎯 Guía Rápida: Actualizar Versión

## Cuando hagas cambios y quieras que los usuarios vean la actualización:

### 1️⃣ Actualizar versión

```bash
# Cambio pequeño (1.0.1 -> 1.0.2)
./scripts/update-version.sh patch "Descripción del cambio"

# Nueva funcionalidad (1.0.2 -> 1.1.0)
./scripts/update-version.sh minor "Nueva funcionalidad X"

# Cambio grande (1.1.0 -> 2.0.0)
./scripts/update-version.sh major "Rediseño completo"
```

### 2️⃣ Subir a GitHub

```bash
git add .
git commit -m "v1.0.2: Descripción del cambio"
git push origin main
```

### 3️⃣ ¡Listo! 

- Vercel despliega automáticamente
- En máximo **5 minutos**, los usuarios verán una notificación
- Pueden actualizar con un clic

---

## 💡 Ejemplos reales:

```bash
# Corrección de bug
./scripts/update-version.sh patch "Corregido error en el cálculo de totales"

# Nueva vista
./scripts/update-version.sh minor "Agregado módulo de reportes de ventas"

# Mejora visual
./scripts/update-version.sh patch "Mejorado diseño de la vista de usuarios"
```

---

## ⚡ Si necesitas verificar la versión actual:

```bash
cat public/version.json
```
