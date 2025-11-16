import './App.css'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import PuntoDeVentas from './pages/PuntoDeVentas'

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
      {user ? <PuntoDeVentas onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
    </div>
  )
}

export default App
