import React, { useState } from 'react'
import { FiBell, FiCheck, FiUsers, FiMapPin, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'

const MOCK_NOTIFICATIONS = [
  {
    id: 'm1',
    type: 'warning',
    message: '⚠ Rider Balakrishna Kini is 2.3 km away from the group.',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    read: false,
    icon: FiAlertTriangle,
    color: '#EF4444'
  },
  {
    id: 'm2',
    type: 'system',
    message: 'Ride created successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    read: false,
    icon: FiCheckCircle,
    color: '#22C55E'
  },
  {
    id: 'm3',
    type: 'alert',
    message: 'Fuel stations found nearby',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: true,
    icon: FiMapPin,
    color: '#FACC15'
  }
]

const Notifications = () => {
  const [notifications, setNotifications] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('rt_notifications') || '[]')
    return [...saved, ...MOCK_NOTIFICATIONS]
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    // Only save the non-mock ones back if we wanted persistence, but for demo this is fine
  }

  const markRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 0) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <DashboardLayout>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h1><FiBell className="text-accent" /> Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}>
            <FiCheck className="me-1" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-5">
          <FiBell size={40} className="text-muted mb-2" />
          <p className="text-muted">No new notifications</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(n => {
            let Icon = n.icon
            if (typeof Icon === 'string') {
              if (Icon === 'FiAlertTriangle') Icon = FiAlertTriangle
              if (Icon === 'FiCheckCircle') Icon = FiCheckCircle
              if (Icon === 'FiMapPin') Icon = FiMapPin
              if (Icon === 'FiCheck') Icon = FiCheck
              if (Icon === 'FiUsers') Icon = FiUsers
            }
            if (!Icon) Icon = FiBell
            
            return (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                <div className="notif-icon" style={{ background: `${n.color}15`, color: n.color }}>
                  <Icon size={18} />
                </div>
                <div className="notif-content">
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-time">{formatTime(n.timestamp)}</span>
                </div>
                {!n.read && <div className="notif-dot"></div>}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .notifications-list { display: flex; flex-direction: column; gap: 8px; }
        .notif-item {
          display: flex; align-items: center; gap: 14px;
          padding: 1rem 1.25rem; background: var(--bg-card);
          border: 1px solid var(--border-color); border-radius: var(--radius-md);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .notif-item:hover { border-color: var(--primary); }
        .notif-item.unread { background: rgba(255,107,0,0.03); border-color: rgba(255,107,0,0.15); }
        .notif-icon {
          width: 40px; height: 40px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .notif-content { flex: 1; }
        .notif-message { margin: 0; font-size: 0.95rem; font-weight: 600; color: #fff; }
        .notif-time { font-size: 0.75rem; color: var(--text-muted); }
        .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }
      `}</style>
    </DashboardLayout>
  )
}

export default Notifications
