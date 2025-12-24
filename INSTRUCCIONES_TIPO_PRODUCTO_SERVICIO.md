# Implementación del campo TIPO (Producto/Servicio) + Entrada Manual

## 📋 Resumen

Se ha implementado la funcionalidad para diferenciar entre **productos físicos** y **servicios** en el sistema de punto de ventas, incluyendo una funcionalidad de **entrada manual** para servicios al vuelo.

## 🗄️ Cambios en Base de Datos (Supabase)

### SQL para ejecutar en Supabase:

#### 1. Agregar columna tipo a inventario

```sql
-- Agregar columna 'tipo' a la tabla inventario
ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'producto' CHECK (tipo IN ('producto', 'servicio'));

-- Actualizar todos los registros existentes a 'producto' por defecto
UPDATE inventario SET tipo = 'producto' WHERE tipo IS NULL;

-- Comentario en la columna para documentación
COMMENT ON COLUMN inventario.tipo IS 'Tipo de item: producto (físico con stock) o servicio (sin inventario físico)';
```

**Archivo SQL:** `/data/sql/add_tipo_to_inventario.sql`

#### 2. Agregar columna descripcion a ventas_detalle

```sql
-- Agregar columna 'descripcion' a la tabla ventas_detalle
ALTER TABLE ventas_detalle
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Modificar producto_id para que pueda ser NULL (servicios de entrada manual)
ALTER TABLE ventas_detalle
ALTER COLUMN producto_id DROP NOT NULL;

-- Comentarios en las columnas
COMMENT ON COLUMN ventas_detalle.descripcion IS 'Descripción del producto o servicio. Requerido cuando producto_id es NULL (servicios de entrada manual)';
COMMENT ON COLUMN ventas_detalle.producto_id IS 'ID del producto en inventario. Puede ser NULL para servicios de entrada manual';
```

**Archivo SQL:** `/data/sql/add_descripcion_to_ventas_detalle.sql`

## 📝 Cambios Realizados en el Código

### 1. **Punto de Ventas** (`src/pages/PuntoDeVentas.tsx`)

- ✅ Agregado campo `tipo` al type `Producto`
- ✅ Modificado estado `tipoFiltro` eliminando opción "todos"
- ✅ **Servicios requieren precio > 0** (no se pueden agregar con precio 0)
- ✅ Productos físicos requieren precio > 0 Y stock >= 1
- ✅ Actualizado `productosFiltrados` para filtrar por tipo seleccionado
- ✅ Modificado `refreshProducts()` para incluir campo `tipo` en el SELECT
- ✅ **Nuevos botones de filtro**:
  - **📦 Producto**: Filtra solo productos físicos
  - **⚙️ Servicio**: Filtra solo servicios
  - **➕ Entrada Manual**: Abre modal para crear servicios al vuelo
- ✅ **Modal de Entrada Manual** con:
  - Input de descripción del servicio
  - Select con opciones: SERVICIOS VARIOS, REPARACIONES VARIAS, COBRO POR INCONSISTENCIA
  - Input de precio (requerido > 0)
  - Crea producto temporal tipo servicio que se agrega al carrito
- ✅ Servicios temporales (entrada manual) usan `null` como `producto_id`
- ✅ Servicios temporales excluidos del registro de inventario
- ✅ Servicios temporales excluidos de actualización de stock

### 2. **Componente Tabla de Productos** (`src/components/ProductTable.tsx`)

- ✅ Agregado campo `tipo` al type `Producto`
- ✅ Modificada lógica del botón "Agregar":
  - **Todos** (productos y servicios) requieren **precio > 0**
  - Productos físicos también requieren **stock >= 1**
- ✅ Mensajes de validación actualizados

### 3. **Inventario Admin** (`src/pages/adminViews/InventarioTable.tsx`)

- ✅ Agregado campo `tipo` al SELECT de Supabase
- ✅ Agregada columna `tipo` en la vista de tabla
- ✅ Actualizado resumen con conteo de productos y servicios
- ✅ Agregados Cards de resumen:
  - 📦 Productos: cantidad de items tipo "producto"
  - ⚙️ Servicios: cantidad de items tipo "servicio"

### 4. **Formulario de Registro** (`src/components/RecordFormModal.tsx`)

- ✅ Agregado `<select>` para el campo `tipo` con opciones:
  - 📦 Producto (valor por defecto)
  - ⚙️ Servicio

### 5. **Devoluciones** (`src/pages/DevolucionCaja.tsx`)

- ✅ Incluido campo `tipo` al consultar productos
- ✅ Filtrados servicios del registro de ENTRADAS en inventario
- ✅ Excluidos servicios de actualización de stock

## 🎯 Flujo Completo de Funcionamiento

### Al Agregar Nuevo Producto/Servicio:

1. En Admin → Productos (Inventario)
2. Click en "Agregar"
3. Completar formulario incluyendo el campo **TIPO**
4. Seleccionar "Producto" o "Servicio"
5. Guardar

### Al Editar Producto/Servicio:

1. En Admin → Productos (Inventario)
2. Click en botón "Editar" de cualquier fila
3. Modificar el campo **TIPO** si es necesario
4. Guardar cambios

### En Punto de Ventas - Productos Catalogados:

1. Usar los botones de filtro:
   - Click en **"📦 Producto"**: Ver solo productos físicos
   - Click en **"⚙️ Servicio"**: Ver solo servicios catalogados
2. Los filtros se combinan con búsqueda y categoría existentes
3. Agregar al carrito (validación de precio aplica a todos)

### En Punto de Ventas - Entrada Manual (Nuevo):

1. Click en botón **"➕ Entrada Manual"**
2. Se abre modal con formulario:
   - **Descripción**: Ingresar nombre del servicio
   - **Tipo de servicio**: Seleccionar entre:
     - SERVICIOS VARIOS
     - REPARACIONES VARIAS
     - COBRO POR INCONSISTENCIA
   - **Precio**: Ingresar monto (debe ser > 0)
3. Click en "✓ Agregar al Carrito"
4. El servicio se agrega como tipo "servicio" con ID temporal
5. Se puede facturar normalmente
6. **No afecta inventario** (no registra movimientos ni actualiza stock)

## 📊 Comportamiento por Defecto

| Tipo                        | Stock contabilizado | Requiere precio > 0 | Requiere stock >= 1 | Registro inventario    |
| --------------------------- | ------------------- | ------------------- | ------------------- | ---------------------- |
| **Producto**                | ✅ Sí               | ✅ Sí               | ✅ Sí               | ✅ Sí (ENTRADA/SALIDA) |
| **Servicio Catalogado**     | ❌ No               | ✅ Sí               | ❌ No               | ❌ No                  |
| **Servicio Entrada Manual** | ❌ No               | ✅ Sí               | ❌ No               | ❌ No                  |

## ✅ Validaciones

### Productos:

- ✅ Requieren `precio > 0`
- ✅ Requieren `stock >= 1`
- ✅ Afectan registro de inventario
- ✅ Actualizan stock automáticamente

### Servicios (Catalogados y Entrada Manual):

- ✅ Requieren `precio > 0`
- ✅ **NO** requieren stock
- ✅ **NO** afectan registro de inventario
- ✅ **NO** actualizan stock
- ✅ Servicios de entrada manual usan `producto_id = NULL`

### Tabla ventas_detalle:

- ✅ Campo `producto_id` puede ser NULL (servicios de entrada manual)
- ✅ Campo `descripcion` almacena nombre del servicio
- ✅ Mantiene compatibilidad con productos catalogados

## 🔧 Archivos Modificados

1. `/data/sql/add_tipo_to_inventario.sql` (NUEVO)
2. `/data/sql/add_descripcion_to_ventas_detalle.sql` (NUEVO)
3. `/src/pages/PuntoDeVentas.tsx` (Modificado - funcionalidad completa)
4. `/src/pages/adminViews/InventarioTable.tsx` (Modificado)
5. `/src/components/RecordFormModal.tsx` (Modificado)
6. `/src/components/ProductTable.tsx` (Modificado)
7. `/src/pages/DevolucionCaja.tsx` (Modificado)

---

## 📌 Notas Importantes

- ✅ **Compatibilidad**: Todos los productos existentes se mantienen como "producto"
- ✅ **Retrocompatibilidad**: El sistema sigue funcionando con productos antiguos
- ✅ **Filtros**: Solo Producto y Servicio (eliminado "Todos")
- ✅ **Entrada Manual**: Permite crear servicios al vuelo sin catalogar
- ✅ **Sin Breaking Changes**: No se rompe ninguna funcionalidad existente
- ✅ **Validación de Precio**: Ahora es obligatoria para todos (productos y servicios)

## 🚀 Pasos para Desplegar

1. **Ejecutar SQL en Supabase:**

   ```bash
   # 1. Ejecutar: data/sql/add_tipo_to_inventario.sql
   # 2. Ejecutar: data/sql/add_descripcion_to_ventas_detalle.sql
   ```

2. **Verificar cambios locales:**

   ```bash
   npm run dev
   ```

3. **Probar funcionalidad:**
   - Ir a Admin → Productos
   - Crear un producto de tipo "servicio"
   - Ir a Punto de Ventas
   - Usar botones de filtro
   - Probar Entrada Manual de servicio
   - Verificar que filtra correctamente
   - Facturar servicio de entrada manual
   - Verificar que no afecta inventario

---

## 🎨 Interfaz de Usuario

### Botones de Filtro:

- **📦 Producto** - Botón azul cuando seleccionado
- **⚙️ Servicio** - Botón azul cuando seleccionado
- **➕ Entrada Manual** - Botón verde siempre

### Modal de Entrada Manual:

- Título: "⚙️ Entrada Manual - Servicio"
- Campos: Descripción, Tipo de servicio (select), Precio
- Validación: Todos los campos requeridos
- Botones: "Cancelar" (gris) y "✓ Agregar al Carrito" (verde)

---

✨ **Implementación completada exitosamente con funcionalidad de entrada manual**
