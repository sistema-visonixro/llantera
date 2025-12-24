-- Agregar columna 'descripcion' a la tabla ventas_detalle
-- Esta columna permite registrar servicios de entrada manual sin necesidad de tener un producto_id

ALTER TABLE ventas_detalle 
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Modificar producto_id para que pueda ser NULL (servicios de entrada manual)
ALTER TABLE ventas_detalle 
ALTER COLUMN producto_id DROP NOT NULL;

-- Comentario en la columna para documentación
COMMENT ON COLUMN ventas_detalle.descripcion IS 'Descripción del producto o servicio. Requerido cuando producto_id es NULL (servicios de entrada manual)';
COMMENT ON COLUMN ventas_detalle.producto_id IS 'ID del producto en inventario. Puede ser NULL para servicios de entrada manual';
