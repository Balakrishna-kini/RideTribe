import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FiHome, FiMap, FiCompass, FiPlusCircle, FiNavigation,
  FiCamera, FiBell, FiSettings, FiHelpCircle, FiUser
} from 'react-icons/fi'

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/discover', icon: FiCompass, label: 'Discover Rides' },
  { path: '/create-ride', icon: FiPlusCircle, label: 'Create Ride' },
  { path: '/live-tracking', icon: FiNavigation, label: 'Live Tracking' },
  { path: '/memories', icon: FiCamera, label: 'Memories' },
  { path: '/fuel-finder', icon: FiMap, label: 'Fuel Finder' },
  { divider: true },
  { path: '/notifications', icon: FiBell, label: 'Notifications' },
  { path: '/profile', icon: FiUser, label: 'Profile' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
  { path: '/help', icon: FiHelpCircle, label: 'Help' },
]

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="sidebar-divider"></div>
            }
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <div
                key={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path)
                  onClose()
                }}
                style={{ cursor: 'pointer' }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-version">RiderTribe v1.0</div>
        </div>

        <style>{`
          .sidebar {
            position: fixed;
            top: var(--navbar-height);
            left: 0;
            bottom: 0;
            width: var(--sidebar-width);
            background: var(--bg-surface);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            z-index: 1200;
            overflow-y: auto;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .sidebar-nav {
            padding: 1.25rem 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.75rem 1rem;
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
            text-decoration: none;
            transition: all var(--transition-fast);
            position: relative;
          }
          .sidebar-link:hover {
            background: rgba(255,107,0,0.08);
            color: var(--primary);
            transform: translateX(4px);
          }
          .sidebar-link.active {
            background: rgba(255,107,0,0.12);
            color: var(--primary);
            font-weight: 600;
          }
          .sidebar-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 20%;
            height: 60%;
            width: 4px;
            background: var(--primary);
            border-radius: 0 4px 4px 0;
          }
          .sidebar-divider {
            height: 1px;
            background: var(--border-color);
            margin: 1rem 0.5rem;
            opacity: 0.5;
          }
          .sidebar-footer {
            padding: 1.25rem;
            border-top: 1px solid var(--border-color);
            background: rgba(0,0,0,0.05);
          }
          .sidebar-version {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            z-index: 1050;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          /* Mobile Sidebar Logic */
          @media (max-width: 992px) {
            .sidebar {
              transform: translateX(-100%);
              box-shadow: none;
            }
            .sidebar.sidebar-open {
              transform: translateX(0);
              box-shadow: 20px 0 50px rgba(0,0,0,0.5);
            }
          }

          @media (min-width: 993px) {
            .sidebar-overlay {
              display: none !important;
            }
          }
        `}</style>
      </aside>
    </>
  )
}

export default Sidebar
