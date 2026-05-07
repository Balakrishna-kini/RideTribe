import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiBell, FiSearch, FiUser, FiLogOut, FiSettings, FiMenu, FiSun, FiMoon } from 'react-icons/fi'
import Logo from './Logo'

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const isLoggedIn = localStorage.getItem('token')

  // Dark/light mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true // default dark
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <FiMenu size={20} />
        </button>
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="navbar-logo-link">
          <Logo size="small" />
        </Link>
      </div>

      {isLoggedIn && (
        <div className="navbar-center">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search rides, routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="navbar-right">
        {/* Dark/Light toggle */}
        <button
          className="nav-icon-btn theme-toggle"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
        </button>

        {isLoggedIn ? (
          <>
            <Link to="/notifications" className="nav-icon-btn" title="Notifications">
              <FiBell size={18} />
              <span className="notification-dot"></span>
            </Link>
            <div className="dropdown">
              <button
                className="profile-btn dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="profile-avatar">
                  <FiUser size={16} />
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/profile"><FiUser size={14} /> Profile</Link></li>
                <li><Link className="dropdown-item" to="/settings"><FiSettings size={14} /> Settings</Link></li>
                <li><hr className="dropdown-divider" style={{ borderColor: '#2A2A2A' }} /></li>
                <li><button className="dropdown-item" onClick={handleLogout}><FiLogOut size={14} /> Logout</button></li>
              </ul>
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-dark btn-sm me-2">Log In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        )}
      </div>

      <style>{`
        .top-navbar {
          position: fixed; top: 0; left: 0; right: 0;
          height: var(--navbar-height);
          background: rgba(var(--bg-dark-rgb), 0.95);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1rem; z-index: 1200;
        }
        .navbar-left { display: flex; align-items: center; gap: 8px; }
        .navbar-logo-link { text-decoration: none; display: flex; align-items: center; }
        .sidebar-toggle {
          background: none; border: none; color: var(--text-secondary);
          cursor: pointer; width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-md); transition: all var(--transition-fast);
        }
        .sidebar-toggle:hover { background: var(--bg-card); color: var(--primary); }
        .navbar-center { flex: 1; max-width: 480px; margin: 0 1.5rem; }
        .search-box { position: relative; width: 100%; }
        .search-box .search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);
        }
        .search-box input {
          width: 100%; background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-full); padding: 0.5rem 1rem 0.5rem 2.5rem;
          color: var(--text-primary); font-size: 0.85rem; outline: none;
          transition: all var(--transition-fast);
        }
        .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
        .navbar-right { display: flex; align-items: center; gap: 4px; }
        .nav-icon-btn {
          position: relative; width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-md); color: var(--text-secondary);
          transition: all var(--transition-fast); text-decoration: none;
          background: none; border: none; cursor: pointer;
        }
        .nav-icon-btn:hover { background: var(--bg-card); color: var(--primary); }
        .notification-dot {
          position: absolute; top: 8px; right: 8px; width: 8px; height: 8px;
          border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-dark);
        }
        .profile-avatar {
          width: 36px; height: 36px; border-radius: var(--radius-full);
          background: rgba(255,107,0,0.1); border: 2px solid var(--primary);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); transition: all var(--transition-fast);
        }
        .profile-avatar:hover { background: rgba(255,107,0,0.2); }
        
        @media (max-width: 768px) {
          .navbar-center { display: none; }
          .top-navbar { padding: 0 0.75rem; }
          .navbar-logo-link { transform: scale(0.9); }
        }
        
        @media (min-width: 993px) {
          .sidebar-toggle { display: none; }
        }
      `}</style>
    </nav>
  )
}

export default Navbar
