import React, { useState } from 'react'

type User = {
  id: number
  username: string
  password: string
  role?: string
  email?: string
}

type LoginProps = {
  onLogin?: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await fetch('/data-base/data.json')
      if (!res.ok) throw new Error('No se pudo cargar la base de datos local')
      const data = await res.json()
      const users: User[] = data.users || []
      const found = users.find(u => u.username === username && u.password === password)
      if (found) {
        localStorage.setItem('user', JSON.stringify({ id: found.id, username: found.username, role: found.role }))
        setMessage('Inicio de sesión correcto')
        if (typeof onLogin === 'function') onLogin()
      } else {
        setMessage('Credenciales inválidas')
      }
    } catch (err: any) {
      setMessage(err.message || 'Error al consultar la base de datos')
    }
  }

  return (
    <div className="login-root">
      <div className="login-card" role="region" aria-label="login panel">
        <h3 className="login-title">Bienvenido a SET</h3>
        <div className="login-sub">Inicia sesión con tu cuenta</div>

        <div className="login-inner">
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="usuario"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="contraseña"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <button className="btn-primary" type="submit">Entrar</button>
            </div>
          </form>

          {message && <p style={{ marginTop: 12 }}>{message}</p>}

          <div className="login-foot">
            Credenciales de prueba: <span className="hint">admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}
