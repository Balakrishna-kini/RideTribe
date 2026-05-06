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
            z-index: 900;
            overflow-y: auto;
            transition: transform var(--transition-normal);
          }
          .sidebar-nav {
            padding: 1rem 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.65rem 1rem;
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            transition: all var(--transition-fast);
          }
          .sidebar-link:hover {
            background: rgba(255,107,0,0.08);
            color: var(--primary);
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
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 20px;
            background: var(--primary);
            border-radius: 0 4px 4px 0;
          }
          .sidebar-divider {
            height: 1px;
            background: var(--border-color);
            margin: 0.75rem 0.5rem;
          }
          .sidebar-footer {
            padding: 1rem;
            border-top: 1px solid var(--border-color);
          }
          .sidebar-version {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-align: center;
          }
          .sidebar-overlay {
            display: none;
          }

          @media (max-width: 992px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar.sidebar-open {
              transform: translateX(0);
            }
            .sidebar-overlay {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.6);
              z-index: 899;
            }
          }
        `}</style>
      </aside>
    </>
  )
}

export default Sidebar
