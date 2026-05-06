import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FiNavigation, FiArrowLeft, FiTarget, FiCheckCircle, FiX, FiFastForward
} from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import rideService from '../services/rideService'
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
  let bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

const interpolate = (from, to, t) => {
  return from + (to - from) * t
}

const MapController = ({ position, zoom, follow }) => {
  const map = useMap()

  useEffect(() => {
    if (!map || !position || !follow) return
    try {
      map.setView(position, zoom, { animate: true, duration: 0.3 })
    } catch (e) {
      console.warn('Map control error:', e)
    }
  }, [position, zoom, follow, map])

  return null
}

const createNavigationIcon = (heading) => {
  return L.divIcon({
    html: `<div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${heading}deg);
      transition: transform 0.2s ease-out;
    ">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="rgba(255,107,0,0.2)" />
        <path d="M12 3L16 10H8L12 3Z" fill="#FF6B00" />
        <path d="M12 10L14 21H10L12 10Z" fill="#FF6B00" />
      </svg>
    </div>`,
    className: 'navigation-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

const createCustomIcon = (color, type) => {
  const isStart = type === 'start'
  let svg = ''
  if (isStart) {
    svg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="0.2"/>
      <circle cx="12" cy="12" r="5" fill="${color}"/>
      <circle cx="12" cy="12" r="7" stroke="${color}" stroke-width="2"/>
    </svg>`
  } else {
    svg = `<svg width="32" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21L12 21.01M12 21C11 21 7 15 7 11C7 8.23858 9.23858 6 12 6C14.7614 6 17 8.23858 17 11C17 15 13 21 12 21Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="11" r="2" fill="${color}"/>
    </svg>`
  }
  return L.divIcon({
    html: `<div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${svg}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: isStart ? [32, 32] : [32, 40],
    iconAnchor: isStart ? [16, 16] : [16, 40],
  })
}

const START_ICON = createCustomIcon('#22C55E', 'start')
const END_ICON = createCustomIcon('#EF4444', 'end')

const Navigation = () => {
  const { rideId, stateKey } = useParams()
  const navigate = useNavigate()
  
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [routeDistances, setRouteDistances] = useState([])
  const [currentPosition, setCurrentPosition] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [remainingDistance, setRemainingDistance] = useState(0)
  const [eta, setEta] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(30)
  const [heading, setHeading] = useState(0)
  const [zoom, setZoom] = useState(16)
  const [isTracking, setIsTracking] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [useSimulation, setUseSimulation] = useState(true)
  const [follow, setFollow] = useState(true)
  const [instruction, setInstruction] = useState('Continue straight')
  const [instructionDistance, setInstructionDistance] = useState('0 km')
  const [totalDistance, setTotalDistance] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [navTitle, setNavTitle] = useState('Navigation')
  
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const currentIndexRef = useRef(0)
  const segmentProgressRef = useRef(0)
  const traveledDistanceRef = useRef(0)

  useEffect(() => {
    if (stateKey) {
      loadDirectNavigation(stateKey)
    } else if (rideId) {
      loadRide()
    }
  }, [rideId, stateKey])

  const loadDirectNavigation = async (key) => {
    try {
      console.log('📦 Loading direct navigation data from sessionStorage:', key)
      const dataStr = sessionStorage.getItem(key)
      if (!dataStr) {
        throw new Error('Navigation data not found')
      }
      const data = JSON.parse(dataStr)
      console.log('✅ Navigation data loaded:', data)
      
      setNavTitle(data.title || 'Fuel Stop Navigation')
      await processRouteData(data)
      
    } catch (err) {
      console.error('❌ Error loading direct navigation:', err)
      setError('Failed to load navigation data.')
    } finally {
      setLoading(false)
    }
  }

  const loadRide = async () => {
    try {
      const data = await rideService.getRide(rideId)
      setRide(data)
      setNavTitle(data.title || 'Navigation')
      await processRouteData(data)
    } catch (err) {
      console.error('Failed to load ride:', err)
      setError('Failed to load ride details.')
    } finally {
      setLoading(false)
    }
  }

  const processRouteData = async (data) => {
    let coords = []
    
    if (data.route_coords || data.routeCoords) {
      coords = (data.route_coords || data.routeCoords).map(c => [c[1], c[0]])
    } else if ((data.start_lat || data.startLat) && (data.start_lng || data.startLng) && (data.end_lat || data.endLat) && (data.end_lng || data.endLng)) {
      try {
        const origin = `${data.start_lat || data.startLat},${data.start_lng || data.startLng}`
        const destination = `${data.end_lat || data.endLat},${data.end_lng || data.endLng}`
        const distanceData = await rideService.getDistance(origin, destination)
        const rd = distanceData.route_coords || distanceData.routeCoords
        if (rd) {
          coords = rd.map(c => [c[1], c[0]])
        }
      } catch (routeErr) {
        console.warn('Failed to fetch route, using straight line:', routeErr)
        coords = [
          [data.start_lat, data.start_lng],
          [data.end_lat, data.end_lng]
        ]
      }
    }
    
    if (coords.length > 0) {
      const distances = []
      let total = 0
      
      for (let i = 0; i < coords.length - 1; i++) {
        const dist = haversine(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
        distances.push(dist)
        total += dist
      }
      
      setRouteCoordinates(coords)
      setRouteDistances(distances)
      setTotalDistance(total)
      
      setCurrentPosition(coords[0])
      currentIndexRef.current = 0
      segmentProgressRef.current = 0
      traveledDistanceRef.current = 0
      setRemainingDistance(total)
      setEta(Math.round(total / 30 * 60))
      
      if (coords.length > 1) {
        const initialHeading = calculateBearing(
          coords[0][0], coords[0][1],
          coords[1][0], coords[1][1]
        )
        setHeading(initialHeading)
      }
    }
  }

  const calculateTurnAngle = (i, coords) => {
    if (i < 2 || i >= coords.length - 1) return 0
    const bearing1 = calculateBearing(coords[i - 2][0], coords[i - 2][1], coords[i - 1][0], coords[i - 1][1])
    const bearing2 = calculateBearing(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
    let angle = bearing2 - bearing1
    if (angle > 180) angle -= 360
    if (angle < -180) angle += 360
    return angle
  }

  const animateSimulation = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const deltaTime = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp

    if (!routeCoordinates.length || !isTracking || isCompleted) {
      return
    }

    const prevIndex = currentIndexRef.current
    
    if (prevIndex >= routeCoordinates.length - 1) {
      console.log('✅ Arrived at destination!')
      setIsCompleted(true)
      setIsTracking(false)
      setProgress(100)
      setRemainingDistance(0)
      setEta(0)
      return
    }

    const turnAngle = calculateTurnAngle(prevIndex + 1, routeCoordinates)
    const isTurn = Math.abs(turnAngle) > 20
    const speed = isTurn ? 40 : 80
    setCurrentSpeed(speed)

    // Speed multiplier scaling: 1x=1, 4x=6, 8x=250 (Extreme Warp)
    let effectiveSpeedMultiplier = simulationSpeed
    if (simulationSpeed === 4) effectiveSpeedMultiplier = 6
    if (simulationSpeed === 8) effectiveSpeedMultiplier = 250
    
    const moveAmount = (speed / 3600) * deltaTime * effectiveSpeedMultiplier
    const segmentLength = routeDistances[prevIndex]
    let currentSegmentProgress = segmentProgressRef.current + (moveAmount / Math.max(segmentLength, 0.0001))
    currentSegmentProgress = Math.min(1, currentSegmentProgress)

    const newLat = interpolate(routeCoordinates[prevIndex][0], routeCoordinates[prevIndex + 1][0], currentSegmentProgress)
    const newLng = interpolate(routeCoordinates[prevIndex][1], routeCoordinates[prevIndex + 1][1], currentSegmentProgress)
    setCurrentPosition([newLat, newLng])

    const newHeading = calculateBearing(
      routeCoordinates[prevIndex][0], routeCoordinates[prevIndex][1],
      routeCoordinates[prevIndex + 1][0], routeCoordinates[prevIndex + 1][1]
    )
    setHeading(newHeading)

    const traveledInCurrentSegment = segmentLength * currentSegmentProgress
    let totalTraveled = 0
    for (let i = 0; i < prevIndex; i++) {
      totalTraveled += routeDistances[i]
    }
    totalTraveled += traveledInCurrentSegment
    traveledDistanceRef.current = totalTraveled
    
    const remaining = totalDistance - totalTraveled
    setRemainingDistance(remaining)
    const newProgress = Math.min(100, (totalTraveled / totalDistance) * 100)
    setProgress(newProgress)
    setEta(Math.max(0, Math.round(remaining / speed * 60)))

    if (isTurn && turnAngle > 0) {
      setInstruction('Turn right')
    } else if (isTurn && turnAngle < 0) {
      setInstruction('Turn left')
    } else {
      setInstruction('Continue straight')
    }

    setInstructionDistance(remaining < 1 ? `${(remaining * 1000).toFixed(0)} m` : `${remaining.toFixed(1)} km`)
    setZoom(isTurn ? 17 : 16)

    console.log(`📍 Navigation Update: index=${prevIndex}, traveled=${totalTraveled.toFixed(2)}km, remaining=${remaining.toFixed(2)}km, speed=${speed}km/h, progress=${Math.round(newProgress)}%`)

    if (currentSegmentProgress >= 1) {
      currentIndexRef.current = prevIndex + 1
      segmentProgressRef.current = 0
      setCurrentIndex(prevIndex + 1)
    } else {
      segmentProgressRef.current = currentSegmentProgress
    }

    animationRef.current = requestAnimationFrame(animateSimulation)
  }, [routeCoordinates, routeDistances, totalDistance, isTracking, isCompleted, simulationSpeed])

  useEffect(() => {
    if (isTracking && useSimulation && routeCoordinates.length > 0) {
      console.log('🚀 Starting navigation simulation!')
      lastTimeRef.current = 0
      setStartTime(Date.now())
      animationRef.current = requestAnimationFrame(animateSimulation)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isTracking, useSimulation, routeCoordinates.length, animateSimulation])

  const startTracking = () => {
    console.log('▶️ Start Navigation clicked!')
    setIsTracking(true)
    setFollow(true)
    if (routeCoordinates.length > 0 && currentIndexRef.current === 0) {
      setCurrentPosition(routeCoordinates[0])
      segmentProgressRef.current = 0
      traveledDistanceRef.current = 0
    }
  }

  const stopTracking = () => {
    console.log('⏸️ Pause Navigation clicked!')
    setIsTracking(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handleCompleteRide = async () => {
    setIsCompleted(true)
    setIsTracking(false)
  }

  let startLat = ride?.start_lat || ride?.startLat
  let startLng = ride?.start_lng || ride?.startLng
  let endLat = ride?.end_lat || ride?.endLat
  let endLng = ride?.end_lng || ride?.endLng
  
  if (routeCoordinates.length > 0) {
    startLat = routeCoordinates[0][0]
    startLng = routeCoordinates[0][1]
    endLat = routeCoordinates[routeCoordinates.length - 1][0]
    endLng = routeCoordinates[routeCoordinates.length - 1][1]
  }

  const markers = [
    ...(startLat && startLng ? [{ position: [startLat, startLng], type: 'start' }] : []),
    ...(endLat && endLng ? [{ position: [endLat, endLng], type: 'end' }] : []),
  ]

  const completedCoords = currentIndexRef.current > 0 ? routeCoordinates.slice(0, currentIndexRef.current + 1) : []
  const activeCoords = currentIndexRef.current < routeCoordinates.length - 1 ? routeCoordinates.slice(currentIndexRef.current) : []

  const mapCenter = currentPosition || [startLat || 20.5937, startLng || 78.9629]

  const rideDuration = startTime ? Math.round((Date.now() - startTime) / 60000) : 0
  const avgSpeed = rideDuration > 0 ? Math.round(totalDistance / (rideDuration / 60)) : 0

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-accent" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="text-muted display-1 mb-3">⚠️</div>
          <p className="text-muted">{error}</p>
          <button onClick={() => navigate('/discover')} className="btn btn-primary mt-2">Back to Rides</button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center mb-3">
        <button onClick={() => navigate(-1)} className="btn btn-dark btn-sm me-2">
          <FiArrowLeft size={14} />
        </button>
        <div>
          <h1 className="h3 mb-0"><FiNavigation className="text-accent" /> {navTitle}</h1>
        </div>
      </div>

      {isCompleted && (
        <div className="completion-overlay">
          <div className="completion-card animate-fadeInUp">
            <div className="completion-icon">
              <FiCheckCircle size={64} />
            </div>
            <h2>Navigation Complete!</h2>
            <p className="text-muted mb-4">Great ride! You've reached your destination.</p>
            
            <div className="completion-stats mb-4">
              <div className="completion-stat">
                <div className="completion-stat-value">{totalDistance.toFixed(1)} km</div>
                <div className="completion-stat-label">Total Distance</div>
              </div>
              <div className="completion-stat">
                <div className="completion-stat-value">{rideDuration} min</div>
                <div className="completion-stat-label">Duration</div>
              </div>
              <div className="completion-stat">
                <div className="completion-stat-value">{avgSpeed} km/h</div>
                <div className="completion-stat-label">Avg Speed</div>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-center">
              <button onClick={() => navigate('/discover')} className="btn btn-dark">
                Back to Rides
              </button>
              <button onClick={() => navigate('/fuel-finder')} className="btn btn-primary">
                Fuel Finder
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row g-0">
        <div className="col-12">
          <div className="navigation-map-container">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              zoomControl={false}
              style={{ height: '70vh', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              <ZoomControl position="bottomright" />
              
              <MapController position={currentPosition} zoom={zoom} follow={follow} />

              {completedCoords.length > 1 && (
                <Polyline
                  positions={completedCoords}
                  color="rgba(100, 100, 100, 0.5)"
                  weight={5}
                  opacity={0.6}
                  lineCap="round"
                  lineJoin="round"
                />
              )}

              {activeCoords.length > 1 && (
                <>
                  <Polyline
                    positions={activeCoords}
                    color="rgba(255, 107, 0, 0.3)"
                    weight={10}
                    opacity={0.4}
                    lineCap="round"
                    lineJoin="round"
                  />
                  <Polyline
                    positions={activeCoords}
                    color="#FF6B00"
                    weight={6}
                    opacity={0.95}
                    lineCap="round"
                    lineJoin="round"
                  />
                </>
              )}

              {markers.map((m, i) => (
                <Marker
                  key={i}
                  position={m.position}
                  icon={m.type === 'start' ? START_ICON : END_ICON}
                />
              ))}

              {currentPosition && (
                <Marker
                  position={currentPosition}
                  icon={createNavigationIcon(heading)}
                />
              )}
            </MapContainer>

            <div className="navigation-overlay">
              <div className="instruction-banner">
                <div className="instruction-icon">
                  {instruction.includes('Turn right') && '↱'}
                  {instruction.includes('Turn left') && '↰'}
                  {instruction.includes('Continue') && '↑'}
                </div>
                <div className="instruction-text">
                  <div className="instruction-main">{instruction}</div>
                  <div className="instruction-distance">{instructionDistance}</div>
                </div>
              </div>

              <div className="top-controls">
                <button onClick={() => navigate(-1)} className="btn btn-dark btn-sm">
                  <FiArrowLeft size={16} />
                </button>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="simulationMode" 
                    checked={useSimulation}
                    onChange={(e) => setUseSimulation(e.target.checked)}
                    disabled={isTracking}
                  />
                  <label className="form-check-label small text-white" htmlFor="simulationMode">
                    Simulation
                  </label>
                </div>
                <button onClick={() => setFollow(!follow)} className={`btn btn-sm ${follow ? 'btn-primary' : 'btn-dark'}`}>
                  <FiTarget size={16} />
                </button>
              </div>

              <div className="speed-control">
                <div className="small text-white mb-1">Speed</div>
                <div className="d-flex gap-1">
                  {[1, 4, 8].map(x => (
                    <button
                      key={x}
                      className={`btn btn-sm ${simulationSpeed === x ? 'btn-primary' : 'btn-dark'}`}
                      onClick={() => setSimulationSpeed(x)}
                      disabled={!isTracking}
                    >
                      {x === 8 ? 'Too Fast' : `${x}x`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bottom-panel">
                <div className="bottom-panel-grid">
                  <div className="stat-item">
                    <div className="stat-value">{Math.round(progress)}%</div>
                    <div className="stat-label">Progress</div>
                    <div className="stat-bar">
                      <div className="stat-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {remainingDistance < 1 ? `${(remainingDistance * 1000).toFixed(0)} m` : `${remainingDistance.toFixed(1)} km`}
                    </div>
                    <div className="stat-label">Remaining</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{eta} min</div>
                    <div className="stat-label">ETA</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{Math.round(currentSpeed)} km/h</div>
                    <div className="stat-label">Speed</div>
                  </div>
                </div>

                <div className="action-buttons">
                  {!isTracking ? (
                    <button className="btn btn-primary btn-lg w-100" onClick={startTracking}>
                      <FiNavigation size={18} className="me-2" /> Start Navigation
                    </button>
                  ) : (
                    <div className="d-flex gap-2 w-100">
                      <button className="btn btn-dark btn-lg flex-grow-1" onClick={stopTracking}>
                        ⏸ Pause
                      </button>
                      <button 
                        className="btn btn-danger btn-lg" 
                        onClick={() => { if(window.confirm('End navigation?')) handleCompleteRide() }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .navigation-map-container {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #0f0f1e;
        }
        .navigation-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
        }
        .instruction-banner {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 280px;
          pointer-events: auto;
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 1001;
        }
        .instruction-icon {
          font-size: 2rem;
          color: #FF6B00;
          font-weight: bold;
          line-height: 1;
        }
        .instruction-main {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }
        .instruction-distance {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
          margin-top: 2px;
        }
        .top-controls {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: auto;
          z-index: 1001;
        }
        .speed-control {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 10px 12px;
          pointer-events: auto;
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 1001;
        }
        .bottom-panel {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px;
          pointer-events: auto;
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 1001;
        }
        .bottom-panel-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-bar {
          height: 4px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }
        .stat-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF6B00, #FF8F3F);
          border-radius: 2px;
          transition: width 0.3s ease-out;
        }
        .action-buttons {
          display: flex;
        }
        .completion-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .completion-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 40px;
          text-align: center;
          max-width: 450px;
          width: 100%;
          border: 1px solid var(--border-color);
        }
        .completion-icon {
          color: #22C55E;
          margin-bottom: 16px;
        }
        .completion-card h2 {
          font-weight: 800;
          margin-bottom: 8px;
        }
        .completion-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .completion-stat {
          text-align: center;
        }
        .completion-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
        }
        .completion-stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .leaflet-container {
          background: #111 !important;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .leaflet-bar a {
          background-color: rgba(0,0,0,0.8) !important;
          color: #fff !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          backdrop-filter: blur(10px);
        }
        .leaflet-bar a:hover {
          background-color: rgba(0,0,0,0.9) !important;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default Navigation
