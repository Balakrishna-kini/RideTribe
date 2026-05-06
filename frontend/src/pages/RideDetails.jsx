import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiMapPin, FiCalendar, FiClock, FiUsers, FiArrowLeft,
  FiUserPlus, FiUserMinus, FiNavigation, FiShare2,
  FiTrash2, FiCheck, FiAlertTriangle, FiMap
} from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import rideService from '../services/rideService'
import authService from '../services/authService'
import ModernMap from '../components/ModernMap'
import { getRideImage } from '../utils/rideUtils'

const RideDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()

  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const [joinError, setJoinError] = useState('')
  const [startLoading, setStartLoading] = useState(false)

  useEffect(() => {
    loadRide()
  }, [id])

  const loadRide = async () => {
    try {
      const data = await rideService.getRide(id)
      setRide(data)
    } catch (err) {
      setError('Failed to load ride details.')
    } finally {
      setLoading(false)
    }
  }

  // Check if current user is already a member
  const isMember = ride?.members?.some(
    m => m.userId === currentUser?.id || m.user_id === currentUser?.id
  )
  const isOrganizer = ride?.organizer === currentUser?.id ||
    ride?.organizerName === `${currentUser?.firstName} ${currentUser?.lastName}` ||
    ride?.organizer_name === `${currentUser?.first_name} ${currentUser?.last_name}`

  const handleJoin = async () => {
    setJoinLoading(true)
    setJoinError('')
    try {
      const result = await rideService.joinRide(id)
      // Refresh ride to get updated member list
      await loadRide()
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to join ride.'
      setJoinError(msg)
    } finally {
      setJoinLoading(false)
    }
  }

  const handleLeave = async () => {
    setJoinLoading(true)
    setJoinError('')
    try {
      await rideService.leaveRide(id)
      await loadRide()
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to leave ride.'
      setJoinError(msg)
    } finally {
      setJoinLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${ride.title}"? This cannot be undone.`)) return
    setDeleteLoading(true)
    try {
      await rideService.deleteRide(id)
      navigate('/discover')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete ride.')
      setDeleteLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('Link copied!')
    } catch {
      // fallback for older browsers
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setShareMsg('Link copied!')
    }
    setTimeout(() => setShareMsg(''), 2500)
  }

  const handleStartRide = async () => {
    if (ride.status === 'upcoming' && isOrganizer) {
      setStartLoading(true)
      try {
        await rideService.updateRide(id, { ...ride, status: 'active' })
        navigate(`/live-tracking?rideId=${id}`)
      } catch (err) {
        setError('Failed to start ride.')
      } finally {
        setStartLoading(false)
      }
    } else {
      navigate(`/live-tracking?rideId=${id}`)
    }
  }

  const startLat = ride?.startLat || ride?.start_lat
  const startLng = ride?.startLng || ride?.start_lng
  const endLat = ride?.endLat || ride?.end_lat
  const endLng = ride?.endLng || ride?.end_lng

  const startCoords = startLat ? [startLat, startLng] : null
  const endCoords = endLat ? [endLat, endLng] : null

  // Calculate center and bounds
  const center = startCoords && endCoords
    ? [(startCoords[0] + endCoords[0]) / 2, (startCoords[1] + endCoords[1]) / 2]
    : [20.5937, 78.9629]
  
  const bounds = startCoords && endCoords ? [startCoords, endCoords] : null

  // Directions URL logic
  const osmRouteUrl = ride && (ride.startLat || ride.start_lat)
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${ride.startLat || ride.start_lat}%2C${ride.startLng || ride.start_lng}%3B${ride.endLat || ride.end_lat}%2C${ride.endLng || ride.end_lng}`
    : null

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-accent" />
        </div>
      </DashboardLayout>
    )
  }

  if (!ride || error) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <FiAlertTriangle size={40} className="text-muted mb-2" />
          <p className="text-muted">{error || 'Ride not found.'}</p>
          <Link to="/discover" className="btn btn-primary mt-2">Back to Rides</Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusColors = {
    upcoming: { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6' },
    active:   { bg: 'rgba(34,197,94,0.2)',  color: '#22C55E' },
    completed:{ bg: 'rgba(107,114,128,0.2)', color: '#9CA3AF' },
  }
  const sc = statusColors[ride.status] || statusColors.upcoming

  const startLoc = ride.startLocation || ride.start_location || '—'
  const endLoc   = ride.endLocation   || ride.end_location   || '—'
  const memberCount = ride.memberCount ?? ride.member_count ?? 0

  return (
    <DashboardLayout>
      {/* Back link */}
      <Link to="/discover" className="btn btn-dark btn-sm mb-3">
        <FiArrowLeft className="me-1" /> Back to Rides
      </Link>

      {/* Hero Banner */}
      <div
        className="ride-detail-hero"
        style={{ backgroundImage: `url(${getRideImage(ride)})` }}
      >
        <div className="ride-detail-overlay">
          <span className="status-pill" style={{ background: sc.bg, color: sc.color }}>
            {ride.status?.toUpperCase()}
          </span>
          <h1 className="ride-detail-title">{ride.title}</h1>
          <div className="ride-detail-meta">
            <span><FiMapPin size={14} /> {startLoc} → {endLoc}</span>
            <span><FiCalendar size={14} /> {ride.date}</span>
            {ride.time && <span><FiClock size={14} /> {ride.time}</span>}
            <span><FiUsers size={14} /> {memberCount}/{ride.maxMembers || ride.max_members} riders</span>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-0">
        {/* Left: Description + Map */}
        <div className="col-lg-8">
          {/* About */}
          <div className="detail-card mb-4">
            <h3 className="card-section-title">About this Ride</h3>
            <p className="text-secondary mb-0">
              {ride.description || 'No description provided.'}
            </p>
            {(ride.distance || ride.duration_min) && (
              <div className="detail-stats">
                {ride.distance && (
                  <div className="detail-stat">
                    <span className="detail-stat-value">{ride.distance}</span>
                    <span className="detail-stat-label">km road distance</span>
                  </div>
                )}
                {ride.durationMin && (
                  <div className="detail-stat">
                    <span className="detail-stat-value">{ride.durationMin}</span>
                    <span className="detail-stat-label">min estimated</span>
                  </div>
                )}
                <div className="detail-stat">
                  <span className="detail-stat-value">{memberCount}</span>
                  <span className="detail-stat-label">riders joined</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-value">{(ride.maxMembers || ride.max_members || 0) - memberCount}</span>
                  <span className="detail-stat-label">spots left</span>
                </div>
              </div>
            )}
          </div>

          {/* Route Map */}
          <div className="detail-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="card-section-title mb-0">
                <FiMap size={16} className="me-2" />Route Map
              </h3>
              {startCoords && (
                <Link to={`/navigation/${ride.id}`} className="btn btn-primary btn-sm">
                  <FiNavigation size={13} className="me-1" />Start Navigation
                </Link>
              )}
            </div>

            {startCoords ? (
              <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 1 }}>
                <ModernMap
                  center={center}
                  bounds={bounds || undefined}
                  markers={[
                    { position: startCoords, type: 'start' },
                    ...(endCoords ? [{ position: endCoords, type: 'end' }] : [])
                  ]}
                  polyline={(ride.route_coords || ride.routeCoords)?.map(c => [c[1], c[0]])}
                  interactive={true}
                />
              </div>
            ) : (
              /* Fallback: static OSM search link */
              <div className="route-map-fallback">
                <FiMapPin size={28} className="text-accent mb-2" />
                <p className="text-muted small mb-2">
                  {startLoc} → {endLoc}
                </p>
                {osmRouteUrl && (
                  <a href={osmRouteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                    <FiNavigation size={13} className="me-1" />Get Directions
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions + Organizer + Members */}
        <div className="col-lg-4">
          {/* Actions Card */}
          <div className="detail-card mb-4">
            {/* Join / Leave */}
            {ride.status !== 'completed' && (
              <>
                {isMember ? (
                  <button
                    className="btn btn-outline-primary w-100 mb-2"
                    onClick={handleLeave}
                    disabled={joinLoading || isOrganizer}
                    title={isOrganizer ? "You are the organizer" : ""}
                  >
                    {joinLoading
                      ? <span className="spinner-border spinner-border-sm me-2" />
                      : <FiUserMinus className="me-2" />}
                    {isOrganizer ? 'Organizer' : 'Leave Ride'}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary w-100 mb-2"
                    onClick={handleJoin}
                    disabled={joinLoading || memberCount >= (ride.maxMembers || ride.max_members)}
                  >
                    {joinLoading
                      ? <span className="spinner-border spinner-border-sm me-2" />
                      : <FiUserPlus className="me-2" />}
                    {memberCount >= (ride.maxMembers || ride.max_members) ? 'Ride Full' : 'Join Ride'}
                  </button>
                )}

                {joinError && (
                  <div className="alert-inline warning mb-2">
                    <FiAlertTriangle size={13} className="me-1" />{joinError}
                  </div>
                )}
              </>
            )}

            {/* Start Ride / Live Tracking Actions */}
            {ride.status === 'upcoming' && isOrganizer && (
              <button className="btn btn-success w-100 mb-2" onClick={handleStartRide} disabled={startLoading}>
                {startLoading ? <span className="spinner-border spinner-border-sm me-2" /> : <FiNavigation className="me-2" />}
                Start Ride Now
              </button>
            )}

            {ride.status === 'active' && (
              <button className="btn btn-success w-100 mb-2" onClick={handleStartRide}>
                <FiNavigation className="me-2" /> Go to Live Tracking
              </button>
            )}

            {/* Share */}
            <button className="btn btn-dark w-100 mb-2" onClick={handleShare}>
              {shareMsg
                ? <><FiCheck className="me-2" />{shareMsg}</>
                : <><FiShare2 className="me-2" />Share Ride</>
              }
            </button>

            {/* Delete (organizer only) */}
            {isOrganizer && (
              <button
                className="btn btn-danger-soft w-100"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? <span className="spinner-border spinner-border-sm me-2" />
                  : <FiTrash2 className="me-2" />}
                Delete Ride
              </button>
            )}
          </div>

          {/* Organizer */}
          <div className="detail-card mb-4">
            <h4 className="card-section-title">Organizer</h4>
            <div className="organizer-info">
              <div className="organizer-avatar">
                {(ride.organizerName || ride.organizer_name || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="fw-600">{ride.organizerName || ride.organizer_name || 'Rider'}</div>
                <div className="text-muted small">Ride Organizer</div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="detail-card">
            <h4 className="card-section-title">
              <FiUsers size={15} className="me-2" />
              Members ({memberCount}/{ride.maxMembers || ride.max_members})
            </h4>
            {/* Progress bar */}
            <div className="member-progress mb-3">
              <div
                className="member-progress-fill"
                style={{ width: `${(memberCount / (ride.maxMembers || ride.max_members || 1)) * 100}%` }}
              />
            </div>
            <div className="member-list">
              {(ride.members || []).map((m, i) => (
                <div key={i} className="member-item">
                  <div className="member-avatar">
                    {(m.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span>{m.name || 'Rider'}</span>
                  {(m.userId === currentUser?.id || m.user_id === currentUser?.id) && (
                    <span className="you-badge">You</span>
                  )}
                </div>
              ))}
              {(!ride.members || ride.members.length === 0) && (
                <p className="text-muted small mb-0">No members yet — be the first to join!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ride-detail-hero {
          height: 300px; border-radius: var(--radius-lg);
          background-size: cover; background-position: center;
          position: relative; overflow: hidden; margin-bottom: 0;
        }
        .ride-detail-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(transparent 15%, rgba(0,0,0,0.88));
          display: flex; flex-direction: column; justify-content: flex-end; padding: 2rem;
        }
        .status-pill {
          display: inline-block; padding: 3px 12px; border-radius: 20px;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 0.75rem; width: fit-content;
        }
        .ride-detail-title {
          font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff;
        }
        .ride-detail-meta {
          display: flex; gap: 1.25rem; flex-wrap: wrap;
          color: rgba(255,255,255,0.75); font-size: 0.85rem;
        }
        .ride-detail-meta span { display: flex; align-items: center; gap: 5px; }
        .detail-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.5rem;
        }
        .card-section-title {
          font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;
          display: flex; align-items: center; color: var(--text-primary);
        }
        .detail-stats {
          display: flex; gap: 1.5rem; flex-wrap: wrap;
          margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);
        }
        .detail-stat-value {
          font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;
          color: var(--primary); display: block;
        }
        .detail-stat-label { font-size: 0.78rem; color: var(--text-muted); }
        .route-map-iframe {
          width: 100%; height: 250px; border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }
        .route-map-fallback {
          height: 180px; background: var(--bg-input); border-radius: var(--radius-sm);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          border: 1px dashed var(--border-color);
        }
        .alert-inline {
          padding: 0.4rem 0.75rem; border-radius: var(--radius-sm);
          font-size: 0.8rem; display: flex; align-items: center;
        }
        .alert-inline.warning { background: rgba(239,68,68,0.1); color: #EF4444; }
        .btn-success {
          background: #22C55E !important; border-color: #22C55E !important;
          color: #fff !important; font-weight: 600; border-radius: var(--radius-sm);
        }
        .btn-success:hover { background: #16A34A !important; border-color: #16A34A !important; }
        .btn-danger-soft {
          background: rgba(239,68,68,0.1) !important; border: 1px solid rgba(239,68,68,0.3) !important;
          color: #EF4444 !important; font-weight: 600; border-radius: var(--radius-sm);
          width: 100%; padding: 0.5rem 1rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-danger-soft:hover { background: rgba(239,68,68,0.2) !important; }
        .organizer-info { display: flex; align-items: center; gap: 12px; }
        .organizer-avatar {
          width: 44px; height: 44px; border-radius: var(--radius-full);
          background: rgba(255,107,0,0.15); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 1.1rem; flex-shrink: 0;
        }
        .member-progress {
          height: 6px; background: var(--bg-input); border-radius: 10px; overflow: hidden;
        }
        .member-progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light));
          border-radius: 10px; transition: width 0.5s ease;
        }
        .member-list { display: flex; flex-direction: column; gap: 8px; }
        .member-item {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 0; font-size: 0.875rem;
        }
        .member-avatar {
          width: 32px; height: 32px; border-radius: var(--radius-full);
          background: var(--bg-input); border: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700; color: var(--primary); flex-shrink: 0;
        }
        .you-badge {
          margin-left: auto; font-size: 0.7rem; font-weight: 600;
          background: rgba(255,107,0,0.1); color: var(--primary);
          padding: 2px 8px; border-radius: 20px;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default RideDetails
