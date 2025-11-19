import React from 'react'
import SupabaseTable from '../../components/SupabaseTable'

export default function EmpresaTable() {
  return (
    <SupabaseTable
      table="empresa"
      select="id, rtn, nombre, telefono, email, direccion, logo"
      title="Datos de empresa (tabla `empresa`)"
      columns={["id", "rtn", "nombre", "telefono", "email", "direccion", "logo"]}
      searchColumns={["rtn", "nombre", "telefono", "email", "direccion"]}
    />
  )
}
