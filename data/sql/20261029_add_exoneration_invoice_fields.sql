ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS orden_compra_exenta text,
  ADD COLUMN IF NOT EXISTS constancia_registro_exonerado text,
  ADD COLUMN IF NOT EXISTS registro_sag text;

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS orden_compra_exenta text,
  ADD COLUMN IF NOT EXISTS constancia_registro_exonerado text,
  ADD COLUMN IF NOT EXISTS registro_sag text;
