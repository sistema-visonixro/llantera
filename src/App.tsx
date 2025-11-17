import './App.css'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import PuntoDeVentas from './pages/PuntoDeVentas'
import PanelAdmin from './pages/PanelAdmin'

function App() {
  const [user, setUser] = useState<{ id: number; username: string; role?: string } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) setUser(JSON.parse(raw))
    } catch {
      setUser(null)
    }
  }, [])

  function handleLogin() {
    try {
      const raw = localStorage.getItem('user')
      if (raw) setUser(JSON.parse(raw))
    } catch {
      setUser(null)
    }
  }

  function handleLogout() {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <div>
      {!user && <Login onLogin={handleLogin} />}
      {user && user.role === 'cajero' && <PuntoDeVentas onLogout={handleLogout} />}
      {user && user.role === 'admin' && <PanelAdmin onLogout={handleLogout} />}
      {user && user.role !== 'cajero' && user.role !== 'admin' && (
        <div style={{ padding: 24, maxWidth: 900, margin: '32px auto', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acceso restringido</h2>
          <p style={{ color: '#475569' }}>Su cuenta tiene rol "{user.role || 'sin rol'}". Solo usuarios con rol <strong>cajero</strong> pueden acceder al Punto de Ventas.</p>
          <div style={{ marginTop: 18 }}>
            <button onClick={handleLogout} className="btn-opaque">Cerrar sesión</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
