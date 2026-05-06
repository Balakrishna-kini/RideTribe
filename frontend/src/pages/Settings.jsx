import React, { useState, useEffect } from 'react'
import { FiSettings, FiMoon, FiSun, FiMapPin, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const Settings = () => {
  const [theme, setTheme] = useState('dark')
  const [locationStatus, setLocationStatus] = useState('Checking...')
  const navigate = useNavigate()

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationStatus(result.state)
        result.onchange = () => setLocationStatus(result.state)
      })
    } else {
      setLocationStatus('Not supported')
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    alert('Theme switching is disabled in demo mode. The platform is optimized for dark mode.')
  }

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied')
    )
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1><FiSettings className="text-accent" /> Settings</h1>
        <p>Manage your application preferences</p>
      </div>

      <div className="settings-container">
        {/* Theme Settings */}
        <div className="settings-card mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="icon-wrapper">
                {theme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
              </div>
              <div>
                <h5 className="mb-1">App Theme</h5>
                <p className="text-muted small mb-0">Switch between dark and light mode</p>
              </div>
            </div>
            <button className="btn btn-outline-secondary" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>

        {/* Location Settings */}
        <div className="settings-card mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="icon-wrapper" style={{ color: locationStatus === 'granted' ? '#22C55E' : '#EF4444' }}>
                <FiMapPin size={20} />
              </div>
              <div>
                <h5 className="mb-1">Location Services</h5>
                <p className="text-muted small mb-0">Status: <strong style={{ textTransform: 'capitalize' }}>{locationStatus}</strong></p>
              </div>
            </div>
            <button 
              className="btn btn-outline-primary" 
              onClick={requestLocation}
              disabled={locationStatus === 'granted'}
            >
              {locationStatus === 'granted' ? 'Enabled' : 'Request Access'}
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div className="settings-card danger-zone">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="icon-wrapper text-danger">
                <FiLogOut size={20} />
              </div>
              <div>
                <h5 className="mb-1 text-danger">Log Out</h5>
                <p className="text-muted small mb-0">Sign out of your account on this device</p>
              </div>
            </div>
            <button className="btn btn-danger" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-container { max-width: 800px; }
        .settings-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          transition: all var(--transition-fast);
        }
        .settings-card:hover { border-color: var(--primary); }
        .icon-wrapper {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--bg-input); display: flex;
          align-items: center; justify-content: center;
          color: var(--text-primary);
        }
        .danger-zone { border-color: rgba(239,68,68,0.2); }
        .danger-zone:hover { border-color: rgba(239,68,68,0.5); }
      `}</style>
    </DashboardLayout>
  )
}

export default Settings
