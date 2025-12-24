-- Agregar columna 'tipo' a la tabla inventario
-- Esta columna permitirá diferenciar entre productos físicos y servicios

ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'producto' CHECK (tipo IN ('producto', 'servicio'));

-- Actualizar todos los registros existentes a 'producto' por defecto
UPDATE inventario SET tipo = 'producto' WHERE tipo IS NULL;

-- Comentario en la columna para documentación
COMMENT ON COLUMN inventario.tipo IS 'Tipo de item: producto (físico con stock) o servicio (sin inventario físico)';
