import React from 'react'
import SupabaseTable from '../../components/SupabaseTable'

export default function InventarioTable() {
  return (
    <SupabaseTable
      table="Inventario"
      select="id, nombre, sku, descripcion, creado_en"
      title="Inventario (tabla `Inventario`)"
      columns={["id", "nombre", "sku", "descripcion", "creado_en"]}
      searchColumns={["nombre", "sku", "descripcion"]}
    />
  )
}
