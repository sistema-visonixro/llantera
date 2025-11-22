import './App.css'
import { useState, useEffect } from 'react'
import getCompanyData from './lib/getCompanyData'
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

  // Obtener datos de la empresa para mostrar nombre y logo en la pestaña
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const company = await getCompanyData()
        if (!mounted || !company) return
        const name = company.nombre || company.comercio || company.name || ''
        if (name) document.title = String(name)
        const logoUrl = company.logoUrl || company.logo || null
        if (logoUrl) {
          try {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
            if (!link) {
              link = document.createElement('link')
              link.rel = 'icon'
              document.getElementsByTagName('head')[0].appendChild(link)
            }
            link.href = String(logoUrl)
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
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
