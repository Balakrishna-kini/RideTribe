import React, { useState, useEffect, useRef } from 'react'
import { FiMapPin, FiCalendar, FiClock, FiUsers, FiFileText, FiNavigation, FiPlusCircle, FiInfo } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import ModernMap from '../components/ModernMap'
import rideService from '../services/rideService'
import authService from '../services/authService'
import { useNavigate } from 'react-router-dom'

const CreateRide = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '', description: '', startLocation: '', endLocation: '',
    date: '', time: '', maxMembers: 10, distance: '',
  })
  const [distanceInfo, setDistanceInfo] = useState(null)   // { distance_km, duration_min, source }
  const [calcStatus, setCalcStatus] = useState('')          // 'loading' | 'done' | 'error'
  const debounceRef = useRef(null)

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  // Auto-calculate distance when both locations are filled
  useEffect(() => {
    if (!formData.startLocation || !formData.endLocation) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => calculateDistance(), 900)
    return () => clearTimeout(debounceRef.current)
  }, [formData.startLocation, formData.endLocation])

  const [calcError, setCalcError] = useState('')

  const calculateDistance = async () => {
    setCalcStatus('loading')
    setDistanceInfo(null)
    setCalcError('')
    try {
      const result = await rideService.getDistance(formData.startLocation, formData.endLocation)
      setDistanceInfo(result)
      update('distance', result.distanceKm || result.distance_km)
      setCalcStatus('done')
    } catch (err) {
      setCalcStatus('error')
      const msg = err.response?.data?.error || 'Could not calculate route. Please check location names.'
      setCalcError(msg)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        start_location: formData.startLocation,
        end_location: formData.endLocation,
        date: formData.date,
        time: formData.time || null,
        max_members: parseInt(formData.maxMembers),
        distance: formData.distance ? parseFloat(formData.distance) : null,
        duration_min: distanceInfo?.duration_min || null,
        route_coords: distanceInfo?.routeCoords || distanceInfo?.route_coords || null,
        start_lat: distanceInfo?.coords?.start?.[0] || null,
        start_lng: distanceInfo?.coords?.start?.[1] || null,
        end_lat: distanceInfo?.coords?.end?.[0] || null,
        end_lng: distanceInfo?.coords?.end?.[1] || null,
      }
      await rideService.createRide(payload)
      navigate('/discover')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs || 'Failed to create ride.')
      } else {
        setError('Failed to create ride. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const startCoords = distanceInfo?.coords?.start
  const endCoords = distanceInfo?.coords?.end
  const routeCoords = distanceInfo?.routeCoords || distanceInfo?.route_coords

  // Convert route coordinates from [lon, lat] to [lat, lon] for Leaflet
  const polylinePositions = routeCoords ? routeCoords.map(coord => [coord[1], coord[0]]) : null

  // Calculate map center
  const center = startCoords && endCoords
    ? [(startCoords[0] + endCoords[0]) / 2, (startCoords[1] + endCoords[1]) / 2]
    : [20.5937, 78.9629] // Fallback center (India)

  const bounds = startCoords && endCoords ? [startCoords, endCoords] : null
  const mapKey = startCoords ? `${startCoords[0]}-${endCoords ? endCoords[0] : ''}` : 'default-map'

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1><FiPlusCircle className="text-accent" /> Create a Ride</h1>
        <p>Plan your next adventure and invite the tribe</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="row g-4">
        {/* Form */}
        <div className="col-lg-8">
          <div className="create-form-card">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="rideTitle" className="form-label"><FiFileText size={14} className="me-1" /> Ride Title</label>
                <input type="text" id="rideTitle" name="rideTitle" className="form-control"
                  placeholder="e.g. Bangalore to Coorg Weekend Ride"
                  value={formData.title}
                  onChange={(e) => update('title', e.target.value)} required />
              </div>

              <div className="mb-3">
                <label htmlFor="rideDescription" className="form-label"><FiFileText size={14} className="me-1" /> Description</label>
                <textarea id="rideDescription" name="rideDescription" className="form-control" rows="3"
                  placeholder="Describe the route, difficulty, stops, etc."
                  value={formData.description}
                  onChange={(e) => update('description', e.target.value)} />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="startLocation" className="form-label"><FiMapPin size={14} className="me-1" /> Start Location</label>
                  <input type="text" id="startLocation" name="startLocation" className="form-control"
                    placeholder="e.g. Bangalore, Karnataka"
                    value={formData.startLocation}
                    onChange={(e) => update('startLocation', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="endLocation" className="form-label"><FiMapPin size={14} className="me-1" /> End Location</label>
                  <input type="text" id="endLocation" name="endLocation" className="form-control"
                    placeholder="e.g. Coorg, Karnataka"
                    value={formData.endLocation}
                    onChange={(e) => update('endLocation', e.target.value)} required />
                </div>
                {calcStatus && (
                  <div className="col-12">
                    {calcStatus === 'loading' && (
                      <div className="dist-status info">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Calculating distance ....
                      </div>
                    )}
                    {calcStatus === 'done' && distanceInfo && (
                      <div className="dist-status success">
                        <FiNavigation size={14} className="me-1" />
                        {distanceInfo.source === 'ors' ? '🗺️ OpenRouteService:' : '📐 Estimated:'}&nbsp;
                        <strong>{distanceInfo.distanceKm || distanceInfo.distance_km} km</strong>
                        {(distanceInfo.durationMin || distanceInfo.duration_min) && <> &nbsp;·&nbsp; ~{distanceInfo.durationMin || distanceInfo.duration_min} min</>}
                        {distanceInfo.source === 'estimated' && (
                          <span className="ms-2 text-muted" style={{ fontSize: '0.72rem' }}>(road estimate — could not fetch live route)</span>
                        )}
                        {(distanceInfo.apiError || distanceInfo.api_error) && (
                          <div className="mt-2 text-danger small" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            <strong>API Error: </strong>
                            {distanceInfo.apiError || distanceInfo.api_error}
                          </div>
                        )}
                      </div>
                    )}
                    {calcStatus === 'error' && (
                      <div className="dist-status warning d-block">
                        <div className="d-flex align-items-center mb-1">
                          <FiInfo size={14} className="me-1" />
                          <strong>Error:</strong>&nbsp;{calcError}
                        </div>
                        <div className="small opacity-75">Please enter distance manually or try refining the location names (e.g. add City, State).</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label htmlFor="rideDate" className="form-label"><FiCalendar size={14} className="me-1" /> Date</label>
                  <input type="date" id="rideDate" name="rideDate" className="form-control"
                    min={today}
                    value={formData.date}
                    onChange={(e) => update('date', e.target.value)} required />
                </div>
                <div className="col-md-4">
                  <label htmlFor="rideTime" className="form-label"><FiClock size={14} className="me-1" /> Time</label>
                  <input type="time" id="rideTime" name="rideTime" className="form-control"
                    value={formData.time}
                    onChange={(e) => update('time', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label htmlFor="maxMembers" className="form-label"><FiUsers size={14} className="me-1" /> Max Members</label>
                  <input type="number" id="maxMembers" name="maxMembers" className="form-control" min="2" max="50"
                    value={formData.maxMembers}
                    onChange={(e) => update('maxMembers', e.target.value)} />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="estimatedDistance" className="form-label">Estimated Distance (km)</label>
                <input type="number" id="estimatedDistance" name="estimatedDistance" className="form-control"
                  placeholder="Auto-filled when you enter locations"
                  value={formData.distance || ''}
                  onChange={(e) => update('distance', e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {loading ? 'Creating Ride...' : '🏍️ Create Ride'}
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview */}
        <div className="col-lg-4">
          <div className="preview-card">
            <h4 className="widget-title">Live Preview</h4>
            {/* Mini map preview using ModernMap */}
            <div className="preview-map" style={{ height: '250px', position: 'relative', zIndex: 1 }}>
              {startCoords ? (
                <ModernMap
                  center={center}
                  bounds={bounds || undefined}
                  markers={[
                    { position: startCoords, type: 'start' },
                    ...(endCoords ? [{ position: endCoords, type: 'end' }] : [])
                  ]}
                  polyline={polylinePositions}
                  interactive={true}
                />
              ) : (

                <>
                  <div className="map-grid-bg"></div>
                  <div className="preview-map-hint">
                    <FiMapPin size={24} className="text-muted" />
                    <span className="small text-muted">Enter locations to see map</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-3">
              <h5 className="mb-1">{formData.title || <span className="text-muted">Ride Title</span>}</h5>
              {formData.description && (
                <p className="small text-muted mb-2" style={{ lineHeight: 1.4 }}>{formData.description}</p>
              )}
              {formData.startLocation && formData.endLocation && (
                <p className="small text-muted mb-1">
                  <FiMapPin size={11} /> {formData.startLocation} → {formData.endLocation}
                </p>
              )}
              {formData.date && (
                <p className="small text-muted mb-2">
                  <FiCalendar size={11} /> {formData.date}{formData.time && ` at ${formData.time}`}
                </p>
              )}
              <div className="d-flex gap-2 flex-wrap">
                {formData.distance && (
                  <span className="preview-badge" style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}>
                    🛣️ {formData.distance} km
                  </span>
                )}
                {formData.maxMembers && (
                  <span className="preview-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                    <FiUsers size={11} /> {formData.maxMembers} max
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .create-form-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 2rem;
        }
        .preview-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.25rem;
          position: sticky; top: calc(var(--navbar-height) + 2rem);
        }
        .widget-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; }
        .preview-map {
          height: 180px; background: #0f0f1e; border-radius: var(--radius-sm);
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 8px;
        }
        .map-grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .preview-route-svg {
          position: absolute; inset: 0; width: 100%; height: 100%;
        }
        .preview-map-hint {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; z-index: 2;
        }
        .preview-coord {
          position: absolute; display: flex; align-items: center; gap: 4px;
          z-index: 3; font-size: 0.7rem; color: #fff;
          background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: 20px;
        }
        .start-coord { bottom: 12px; left: 12px; }
        .end-coord { top: 12px; right: 12px; }
        .coord-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .preview-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.75rem; font-weight: 600;
          padding: 3px 10px; border-radius: 20px;
        }
        .dist-status {
          font-size: 0.8rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
          display: flex; align-items: center;
        }
        .dist-status.info { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .dist-status.success { background: rgba(34,197,94,0.1); color: #22C55E; }
        .dist-status.warning { background: rgba(250,204,21,0.1); color: #FACC15; }
      `}</style>
    </DashboardLayout>
  )
}

export default CreateRide
