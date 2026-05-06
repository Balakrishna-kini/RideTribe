import React from 'react'
import { Link } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiUsers, FiArrowRight } from 'react-icons/fi'
import { getRideImage } from '../utils/rideUtils'

const RideCard = ({ ride }) => {
  const {
    id,
    title,
    startLocation,
    endLocation,
    date,
    memberCount,
    maxMembers,
    distance,
    status,
    image,
  } = ride

  const statusColors = {
    upcoming: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
    active: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
    completed: { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
  }

  const sc = statusColors[status] || statusColors.upcoming
  const coverImage = getRideImage(ride)

  return (
    <div className="ride-card">
      <div className="ride-card-image" style={{ backgroundImage: `url(${coverImage})` }}>
        <div className="ride-card-overlay"></div>
        <span className="ride-status-badge" style={{ background: sc.bg, color: sc.color }}>
          {status}
        </span>
      </div>
      <div className="ride-card-body">
        <h3 className="ride-title">{title}</h3>
        <div className="ride-route">
          <div className="route-point">
            <FiMapPin size={14} />
            <span>{startLocation}</span>
          </div>
          <div className="route-line"></div>
          <div className="route-point">
            <FiMapPin size={14} />
            <span>{endLocation}</span>
          </div>
        </div>
        <div className="ride-meta">
          <span><FiCalendar size={14} /> {date}</span>
          <span><FiUsers size={14} /> {memberCount}/{maxMembers}</span>
          {distance && <span className="badge bg-dark">{distance} km</span>}
        </div>
        <Link to={`/ride/${id}`} className="btn btn-outline-primary btn-sm w-100 mt-2">
          View Details <FiArrowRight size={14} />
        </Link>
      </div>

      <style>{`
        .ride-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: all var(--transition-normal);
        }
        .ride-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
          transform: translateY(-4px);
        }
        .ride-card-image {
          height: 160px;
          background-color: #2a2a2a; /* Fallback color */
          background-size: cover;
          background-position: center;
          position: relative;
          transition: transform 0.5s ease;
        }
        .ride-card:hover .ride-card-image {
          transform: scale(1.05);
        }
        .ride-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,0.6));
        }
        .ride-status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ride-card-body {
          padding: 1rem;
        }
        .ride-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .ride-route {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 0.75rem;
        }
        .route-point {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .route-line {
          width: 1px;
          height: 10px;
          background: var(--border-light);
          margin-left: 7px;
        }
        .ride-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .ride-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  )
}

export default RideCard
