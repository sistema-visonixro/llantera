import React from 'react'
import SupabaseTable from '../../components/SupabaseTable'

export default function UsersTable() {
  return (
    <SupabaseTable
      table="users"
      select="id, username, role"
      title="Usuarios (tabla `users`)"
      columns={["id", "username", "role"]}
      searchColumns={["username", "role"]}
    />
  )
}
