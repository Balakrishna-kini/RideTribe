import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  FiNavigation, FiAlertTriangle, FiUsers, FiMapPin, FiRefreshCw, 
  FiWifi, FiWifiOff, FiTarget, FiCheck, FiPlay, FiPause, 
  FiRotateCcw, FiFastForward 
} from 'react-icons/fi'
import { useSearchParams, Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import rideService from '../services/rideService'
import api from '../services/api'
import authService from '../services/authService'
import ModernMap from '../components/ModernMap'

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

const interpolate = (from, to, t) => from + (to - from) * t

const ARRIVAL_THRESHOLD_KM = 0.1
const LAG_THRESHOLD_KM = 2.0
const COLORS = ['#FF6B00', '#3B82F6', '#22C55E', '#FACC15', '#A855F7', '#EC4899']

const LiveTracking = () => {
  const [searchParams] = useSearchParams()
  const initialRideId = searchParams.get('rideId') || ''
  
  // Persistent State Loading
  const savedState = JSON.parse(sessionStorage.getItem('rt_live_tracking_state') || '{}')
  
  const [rides, setRides] = useState([])
  const [selectedRideId, setSelectedRideId] = useState(initialRideId || savedState.selectedRideId || '')
  const [startLoading, setStartLoading] = useState(false)
  const [riders, setRiders] = useState([])
  const [myLocation, setMyLocation] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [isTracking, setIsTracking] = useState(savedState.isTracking || false)
  const [selectedRider, setSelectedRider] = useState(null)
  const [error, setError] = useState('')
  const [isCompleted, setIsCompleted] = useState(savedState.isCompleted || false)
  const [fuelStations, setFuelStations] = useState([])
  const [searchingFuel, setSearchingFuel] = useState(false)
  
  // Simulation Mode State
  const [useSimulation, setUseSimulation] = useState(savedState.useSimulation || false)
  const [simulationActive, setSimulationActive] = useState(savedState.simulationActive || false)
  const [simulationSpeed, setSimulationSpeed] = useState(savedState.simulationSpeed || 1)
  const [routeCoordinates, setRouteCoordinates] = useState(savedState.routeCoordinates || [])
  const [routeDistances, setRouteDistances] = useState(savedState.routeDistances || [])
  const [totalDistance, setTotalDistance] = useState(savedState.totalDistance || 0)
  const [simulatedRiders, setSimulatedRiders] = useState(() => {
    if (savedState.simulatedRiders) {
      return savedState.simulatedRiders.map(r => ({
        ...r,
        indexRef: { current: r.index || 0 },
        segmentProgressRef: { current: r.segmentProgress || 0 },
        traveledDistanceRef: { current: r.traveledDistance || 0 }
      }))
    }
    return []
  })
  const [rideProgress, setRideProgress] = useState(savedState.rideProgress || 0)
  const [rideETA, setRideETA] = useState(savedState.rideETA || 0)
  const [activeAlerts, setActiveAlerts] = useState([])
  const [riderDistances, setRiderDistances] = useState({})
  
  const lastAlertTimesRef = useRef({})
  const prevLaggingRef = useRef(new Set())
  
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)

  const selectedRide = rides.find(r => String(r.id) === selectedRideId)
  const isOrganizer = selectedRide && (
    selectedRide.organizer === authService.getCurrentUser()?.id ||
    selectedRide.organizer_name === `${authService.getCurrentUser()?.first_name} ${authService.getCurrentUser()?.last_name}`
  )

  // Fetch user's rides on mount
  useEffect(() => {
    rideService.getRides().then(data => {
      setRides(data)
      if (!selectedRideId) {
        const active = data.find(r => r.status === 'active')
        if (active) setSelectedRideId(String(active.id))
      }
    }).catch(() => {})
  }, [selectedRideId])

  // Initialize simulation when ride or simulation mode changes
  useEffect(() => {
    if (useSimulation && selectedRide) {
      // Only initialize if we don't have progress for THIS ride
      const hasProgress = simulatedRiders.length > 0 && String(selectedRide.id) === String(savedState.selectedRideId)
      if (!hasProgress) {
        initializeSimulation()
      }
    } else if (!useSimulation) {
      resetSimulation()
    }
  }, [selectedRide?.id, useSimulation])

  // Persist State to sessionStorage
  useEffect(() => {
    const stateToSave = {
      selectedRideId,
      isTracking,
      isCompleted,
      useSimulation,
      simulationActive,
      simulationSpeed,
      routeCoordinates,
      routeDistances,
      totalDistance,
      rideProgress,
      rideETA,
      simulatedRiders: simulatedRiders.map(r => ({
        ...r,
        index: r.indexRef.current,
        segmentProgress: r.segmentProgressRef.current,
        traveledDistance: r.traveledDistanceRef.current,
        // Remove refs to avoid circular JSON issues
        indexRef: undefined,
        segmentProgressRef: undefined,
        traveledDistanceRef: undefined
      }))
    }
    sessionStorage.setItem('rt_live_tracking_state', JSON.stringify(stateToSave))
  }, [
    selectedRideId, isTracking, isCompleted, useSimulation, simulationActive, 
    simulationSpeed, routeCoordinates, rideProgress, rideETA, simulatedRiders
  ])

  const initializeSimulation = () => {
    if (!selectedRide) return
    
    let coords = []
    if (selectedRide.route_coords || selectedRide.routeCoords) {
      coords = (selectedRide.route_coords || selectedRide.routeCoords).map(c => [c[1], c[0]])
    } else if (selectedRide.start_lat && selectedRide.start_lng && 
               selectedRide.end_lat && selectedRide.end_lng) {
      coords = [
        [selectedRide.start_lat, selectedRide.start_lng],
        [selectedRide.end_lat, selectedRide.end_lng]
      ]
    }
    
    if (coords.length > 1) {
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
      setRideProgress(0)
      setRideETA(Math.round(total / 40 * 60))
      
      const memberNames = [
        'You (Organizer)',
        'Rider Alex',
        'Rider Sam',
        'Rider Jordan'
      ]
      
      const initialSimRiders = memberNames.slice(0, 4).map((name, i) => ({
        id: `sim-${i}`,
        name,
        lat: coords[0][0],
        lng: coords[0][1],
        speed: 0,
        color: COLORS[i % COLORS.length],
        indexRef: { current: 0 },
        segmentProgressRef: { current: 0 },
        traveledDistanceRef: { current: 0 },
        speedOffset: i === 3 ? 0.4 : (0.85 + i * 0.1), // Rider Jordan lags significantly for demo
        isOrganizer: i === 0
      }))
      
      setSimulatedRiders(initialSimRiders)
    }
  }

  const resetSimulation = () => {
    // Only reset if we are not in the middle of a tracking session
    if (!isTracking) {
      setRouteCoordinates([])
      setRouteDistances([])
      setTotalDistance(0)
      setRideProgress(0)
      setRideETA(0)
      setSimulatedRiders([])
      setSimulationActive(false)
      sessionStorage.removeItem('rt_live_tracking_state')
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
  }

  const animateSimulation = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const deltaTime = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp
    
    if (!simulationActive || !routeCoordinates.length || simulatedRiders.length === 0) {
      return
    }
    
    let allCompleted = true
    
    const updatedRiders = simulatedRiders.map(rider => {
      if (rider.indexRef.current >= routeCoordinates.length - 1) return rider
      
      allCompleted = false
      
      const turnAngle = calculateTurnAngle(rider.indexRef.current + 1, routeCoordinates)
      const isTurn = Math.abs(turnAngle) > 20
      const baseSpeed = isTurn ? 40 : 80
      
      // Rejoin logic for Rider Jordan (demo)
      let currentSpeedOffset = rider.speedOffset
      if (rider.id === 'sim-3' && !rider.isOrganizer) {
        const leader = simulatedRiders.find(r => r.isOrganizer) || simulatedRiders[0]
        const distToLeader = haversine(rider.lat, rider.lng, leader.lat, leader.lng)
        
        // If > 2.5km away, speed up significantly to catch up
        if (distToLeader > 2.5) {
          currentSpeedOffset = 3.0 
          if (!rider.rejoining) console.log('🏃 Rider Jordan is catching up!')
          rider.rejoining = true
        } else if (distToLeader < 0.3) {
          currentSpeedOffset = 0.4 // Back to slow mode once caught up
          rider.rejoining = false
        }
      }

      const speed = baseSpeed * currentSpeedOffset
      
      // Speed multiplier scaling: 1x=1, 4x=6, 8x=250 (Extreme Warp)
      let effectiveSpeedMultiplier = simulationSpeed
      if (simulationSpeed === 4) effectiveSpeedMultiplier = 6
      if (simulationSpeed === 8) effectiveSpeedMultiplier = 250
      
      const moveAmount = (speed / 3600) * deltaTime * effectiveSpeedMultiplier
      const segmentLength = routeDistances[rider.indexRef.current]
      let currentSegmentProgress = rider.segmentProgressRef.current + (moveAmount / Math.max(segmentLength, 0.0001))
      currentSegmentProgress = Math.min(1, currentSegmentProgress)
      
      const newLat = interpolate(
        routeCoordinates[rider.indexRef.current][0],
        routeCoordinates[rider.indexRef.current + 1][0],
        currentSegmentProgress
      )
      const newLng = interpolate(
        routeCoordinates[rider.indexRef.current][1],
        routeCoordinates[rider.indexRef.current + 1][1],
        currentSegmentProgress
      )
      
      const traveledInCurrentSegment = segmentLength * currentSegmentProgress
      let totalTraveled = 0
      for (let i = 0; i < rider.indexRef.current; i++) {
        totalTraveled += routeDistances[i]
      }
      totalTraveled += traveledInCurrentSegment
      
      const progress = Math.min(100, (totalTraveled / totalDistance) * 100)
      if (rider.isOrganizer) {
        setRideProgress(progress)
        setRideETA(Math.max(0, Math.round((totalDistance - totalTraveled) / speed * 60)))
      }
      
      if (currentSegmentProgress >= 1) {
        rider.indexRef.current = rider.indexRef.current + 1
        rider.segmentProgressRef.current = 0
      } else {
        rider.segmentProgressRef.current = currentSegmentProgress
      }
      rider.traveledDistanceRef.current = totalTraveled
      
      return {
        ...rider,
        lat: newLat,
        lng: newLng,
        speed: Math.round(speed)
      }
    })
    
    if (allCompleted) {
      console.log('✅ All riders arrived!')
      setIsCompleted(true)
      setSimulationActive(false)
      setRideProgress(100)
      setRideETA(0)
      return
    }
    
    setSimulatedRiders(updatedRiders)
    animationRef.current = requestAnimationFrame(animateSimulation)
  }, [simulationActive, routeCoordinates, routeDistances, totalDistance, simulationSpeed, simulatedRiders])

  useEffect(() => {
    if (simulationActive && routeCoordinates.length > 0) {
      console.log('🚀 Starting simulation animation!')
      lastTimeRef.current = 0
      animationRef.current = requestAnimationFrame(animateSimulation)
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [simulationActive, routeCoordinates.length, animateSimulation])

  const calculateTurnAngle = (i, coords) => {
    if (i < 2 || i >= coords.length - 1) return 0
    const bearing1 = calculateBearing(coords[i - 2][0], coords[i - 2][1], coords[i - 1][0], coords[i - 1][1])
    const bearing2 = calculateBearing(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
    let angle = bearing2 - bearing1
    if (angle > 180) angle -= 360
    if (angle < -180) angle += 360
    return angle
  }

  const handleStartSimulation = () => {
    if (simulatedRiders.length === 0) initializeSimulation()
    setSimulationActive(true)
    console.log('▶️ Simulation started!')
  }

  const handlePauseSimulation = () => {
    setSimulationActive(false)
    console.log('⏸️ Simulation paused!')
  }

  const handleResetSimulation = () => {
    setSimulationActive(false)
    setIsCompleted(false)
    initializeSimulation()
    console.log('🔄 Simulation reset!')
  }

  // Push MY GPS location to backend every 5s (real mode)
  useEffect(() => {
    if (!isTracking || !selectedRideId || !myLocation || useSimulation) return
    const push = async () => {
      try {
        await api.post(`/tracking/${selectedRideId}/update/`, {
          latitude: myLocation.lat,
          longitude: myLocation.lng,
          speed: myLocation.speed || 0,
        })
      } catch {}
    }
    push()
    const interval = setInterval(push, 5000)
    return () => clearInterval(interval)
  }, [isTracking, selectedRideId, useSimulation, myLocation])

  // Handle Arrival Detection (real mode)
  useEffect(() => {
    if (!isTracking || !myLocation || !selectedRide || isCompleted || useSimulation) return

    const destLat = selectedRide.end_lat || selectedRide.endLat
    const destLng = selectedRide.end_lng || selectedRide.endLng

    if (destLat && destLng) {
      const distToDest = haversine(myLocation.lat, myLocation.lng, destLat, destLng)
      if (distToDest < ARRIVAL_THRESHOLD_KM) {
        handleCompleteRide()
      }
    }
  }, [isTracking, myLocation, selectedRide, isCompleted, useSimulation])

  const handleCompleteRide = async () => {
    if (!selectedRide || isCompleted) return
    try {
      await rideService.updateRide(selectedRideId, { ...selectedRide, status: 'completed' })
      setIsCompleted(true)
      setIsTracking(false)
      setSimulationActive(false)
      setGpsStatus('idle')
      alert("🎉 You have reached your destination! Ride completed.")
    } catch (err) {
      setError('Failed to mark ride as completed.')
    }
  }

  // Fetch all riders' locations (including self) from backend (Real Mode)
  useEffect(() => {
    if (!isTracking || useSimulation || !selectedRideId) {
      setRiders([])
      return
    }

    const fetchRiders = async () => {
      try {
        console.log(`🔄 Polling for riders for Ride #${selectedRideId}`)
        const res = await api.get(`/tracking/${selectedRideId}/`)
        console.log(`📡 Received response:`, res.data)
        // Map all riders (including self) to local rider format, no duplicates
        const activeRiders = res.data.map((r, i) => ({
          id: r.rider,
          name: r.rider_name || `Rider ${r.rider}`,
          lat: r.latitude,
          lng: r.longitude,
          speed: r.speed || 0,
          color: COLORS[i % COLORS.length],
          isOrganizer: r.is_organizer,
          timestamp: r.timestamp
        }))
        
        console.log(`✅ Processed ${activeRiders.length} active riders for Ride #${selectedRideId}`)
        console.log(`👤 Riders:`, activeRiders.map(o => `${o.name} (${o.isOrganizer ? 'Leader' : 'Member'})`).join(', '))
        
        setRiders(activeRiders)
      } catch (err) {
        console.error('❌ Error fetching riders:', err)
        setRiders([])
      }
    }

    const interval = setInterval(fetchRiders, 3000)
    fetchRiders()
    return () => clearInterval(interval)
  }, [isTracking, useSimulation, selectedRideId])

  const fetchFuelStations = async () => {
    const locationForFuel = useSimulation && simulatedRiders.length > 0 
      ? simulatedRiders[0] 
      : myLocation
      
    if (!locationForFuel) {
      setError('Need your location to find nearby fuel stations.')
      return
    }
    setSearchingFuel(true)
    setError('')
    try {
      const { lat, lng } = locationForFuel
      const radius = 5000
      const query = `
        [out:json];
        node["amenity"="fuel"](around:${radius},${lat},${lng});
        out body;
      `
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      const res = await fetch(url)
      const data = await res.json()
      
      const stations = (data.elements || []).map(el => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags.name || 'Fuel Station',
        brand: el.tags.brand || '',
      }))
      
      setFuelStations(stations)
      if (stations.length === 0) {
        setError('No fuel stations found within 5km.')
      }
    } catch (err) {
      setError('Failed to fetch fuel stations.')
    } finally {
      setSearchingFuel(false)
    }
  }

  // Start/stop browser GPS (real mode)
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied')
      setError('Geolocation not supported by this browser.')
      return
    }
    setGpsStatus('acquiring')
    navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? +(pos.coords.speed * 3.6).toFixed(1) : 0,
          accuracy: pos.coords.accuracy,
        })
        setGpsStatus('active')
      },
      (err) => {
        setGpsStatus('denied')
        setError('GPS access denied. Enable location in browser settings.')
      },
      { enableHighAccuracy: true, maximumAge: 3000 }
    )
  }, [])

  const handleStartTracking = () => {
    if (!selectedRideId) {
      setError('Please select a ride first.')
      return
    }
    setError('')
    setIsTracking(true)
    if (!useSimulation) startGPS()
  }

  const handleStopTracking = () => {
    setIsTracking(false)
    setSimulationActive(false)
    setGpsStatus('idle')
  }

  // Determine current riders (real or simulated)
  const currentRiders = useSimulation ? simulatedRiders : riders
  const currentMyLocation = useSimulation 
    ? (simulatedRiders.length > 0 ? simulatedRiders[0] : null)
    : (riders.find(r => r.id === authService.getCurrentUser()?.id) || myLocation)

  // Compute all positions
  const allPositions = currentRiders.map(r => ({ lat: r.lat, lng: r.lng }))

  const centerLat = allPositions.length
    ? allPositions.reduce((s, p) => s + p.lat, 0) / allPositions.length : 12.97
  const centerLng = allPositions.length
    ? allPositions.reduce((s, p) => s + p.lng, 0) / allPositions.length : 77.59

  // Lag detection
  const allRiders = currentRiders.map(r => ({
    ...r,
    lagging: haversine(r.lat, r.lng, centerLat, centerLng) > LAG_THRESHOLD_KM,
  }))
  
  // Real-time Distance Alert Logic
  useEffect(() => {
    if (!isTracking || allRiders.length < 2) return

    const leader = allRiders.find(r => r.isOrganizer) || allRiders[0]
    const newDistances = {}
    const currentLagging = new Set()
    const now = Date.now()

    allRiders.forEach(rider => {
      if (rider.id === leader.id) return
      
      const dist = haversine(rider.lat, rider.lng, leader.lat, leader.lng)
      newDistances[rider.id] = dist
      
      const isFar = dist > LAG_THRESHOLD_KM
      if (isFar) {
        currentLagging.add(rider.id)
        
        // Trigger alert if not on cooldown
        const lastAlert = lastAlertTimesRef.current[rider.id] || 0
        if (now - lastAlert > 45000) { // 45s cooldown
          const alertId = `alert-${rider.id}-${now}`
          const newAlert = {
            id: alertId,
            type: 'warning',
            message: `⚠ Rider ${rider.name} is ${dist.toFixed(1)} km away from the leader!`,
            riderId: rider.id
          }
          setActiveAlerts(prev => [...prev, newAlert])
          lastAlertTimesRef.current[rider.id] = now
          
          // Persistence for Notifications page
          const savedNotifs = JSON.parse(localStorage.getItem('rt_notifications') || '[]')
          const persistentNotif = {
            id: alertId,
            type: 'warning',
            message: newAlert.message,
            timestamp: new Date().toISOString(),
            read: false,
            icon: 'FiAlertTriangle', // Store as string for easy recovery if needed, or just message
            color: '#EF4444'
          }
          localStorage.setItem('rt_notifications', JSON.stringify([persistentNotif, ...savedNotifs].slice(0, 20)))

          // Auto remove alert after 10s
          setTimeout(() => {
            setActiveAlerts(prev => prev.filter(a => a.id !== alertId))
          }, 10000)
        }
      }
    })

    // Detect rejoins
    prevLaggingRef.current.forEach(riderId => {
      if (!currentLagging.has(riderId)) {
        const rider = allRiders.find(r => r.id === riderId)
        if (rider) {
          const alertId = `rejoin-${riderId}-${now}`
          setActiveAlerts(prev => [...prev, {
            id: alertId,
            type: 'success',
            message: `✅ Rider ${rider.name} has rejoined the group.`,
            riderId: riderId
          }])
          setTimeout(() => {
            setActiveAlerts(prev => prev.filter(a => a.id !== alertId))
          }, 8000)
        }
      }
    })

    setRiderDistances(newDistances)
    prevLaggingRef.current = currentLagging
  }, [allRiders.map(r => `${r.lat},${r.lng}`).join('|'), isTracking])

  const laggingRiders = allRiders.filter(r => (riderDistances[r.id] || 0) > LAG_THRESHOLD_KM)

  const handleStartRide = async () => {
    if (!selectedRide || selectedRide.status !== 'upcoming' || !isOrganizer) return
    setStartLoading(true)
    try {
      await rideService.updateRide(selectedRide.id, { ...selectedRide, status: 'active' })
      const data = await rideService.getRides()
      setRides(data)
    } catch (err) {
      setError('Failed to start ride.')
    } finally {
      setStartLoading(false)
    }
  }

  // Map markers for all riders
  const mapMarkers = allRiders.map(rider => ({
    position: [rider.lat, rider.lng],
    type: 'rider',
    color: rider.color,
    label: rider.name
  }))

  // Map bounds to frame all riders
  const mapBounds = allPositions.length > 0 ? allPositions.map(p => [p.lat, p.lng]) : null

  // Get destination for display
  const destLat = selectedRide?.end_lat || selectedRide?.endLat
  const destLng = selectedRide?.end_lng || selectedRide?.endLng
  const destDistance = currentMyLocation && destLat 
    ? haversine(currentMyLocation.lat, currentMyLocation.lng, destLat, destLng) 
    : 0

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h1><FiNavigation className="text-accent" /> Live Tracking</h1>
            <p>Real-time GPS tracking for your group rides</p>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {/* Simulation Mode Toggle */}
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="simulationMode" 
                checked={useSimulation}
                onChange={(e) => setUseSimulation(e.target.checked)}
                disabled={isTracking && !useSimulation}
              />
              <label className="form-check-label small" htmlFor="simulationMode">
                Simulation Mode
              </label>
            </div>
            
            {/* GPS status indicator (only in real mode) */}
            {!useSimulation && (
              <span className={`gps-badge gps-${gpsStatus}`}>
                {gpsStatus === 'active' ? <FiWifi size={13} /> : <FiWifiOff size={13} />}
                {gpsStatus === 'idle' && 'GPS Off'}
                {gpsStatus === 'acquiring' && 'Acquiring…'}
                {gpsStatus === 'active' && (myLocation?.accuracy > 100 ? 'Low Accuracy' : 'GPS Live')}
                {gpsStatus === 'denied' && 'GPS Denied'}
              </span>
            )}
            
            {currentMyLocation && (
              <div className="d-flex gap-2">
                <button 
                  className={`btn btn-sm ${fuelStations.length > 0 ? 'btn-success' : 'btn-dark'}`}
                  onClick={fetchFuelStations}
                  disabled={searchingFuel}
                  title="Find nearby fuel stations"
                >
                  {searchingFuel ? <span className="spinner-border spinner-border-sm" /> : '⛽ Fuel'}
                </button>
                <button 
                  className="btn btn-dark btn-sm" 
                  onClick={() => {
                    const loc = [currentMyLocation.lat, currentMyLocation.lng]
                    setMyLocation(null)
                    setTimeout(() => setMyLocation({...currentMyLocation}), 10)
                  }}
                  title="Recenter Map"
                >
                  <FiTarget size={14} />
                </button>
              </div>
            )}
            
            {!isTracking ? (
              <button className="btn btn-primary btn-sm" onClick={handleStartTracking}>
                <FiRefreshCw size={13} className="me-1" /> Start Tracking
              </button>
            ) : (
              <button className="btn btn-dark btn-sm" onClick={handleStopTracking}>
                ⏹ Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      {useSimulation && selectedRide && (
        <div className="simulation-controls mb-3 p-3" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex gap-2">
              {!simulationActive ? (
                <button className="btn btn-success btn-sm" onClick={handleStartSimulation}>
                  <FiPlay size={14} className="me-1" /> Start Simulation
                </button>
              ) : (
                <button className="btn btn-warning btn-sm" onClick={handlePauseSimulation}>
                  <FiPause size={14} className="me-1" /> Pause
                </button>
              )}
              <button className="btn btn-dark btn-sm" onClick={handleResetSimulation}>
                <FiRotateCcw size={14} className="me-1" /> Reset
              </button>
            </div>
            
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">Speed:</span>
              {[1, 4, 8].map(x => (
                <button
                  key={x}
                  className={`btn btn-sm ${simulationSpeed === x ? 'btn-primary' : 'btn-dark'}`}
                  onClick={() => setSimulationSpeed(x)}
                >
                  {x === 8 ? 'Too Fast' : `${x}x`}
                </button>
              ))}
            </div>
            
            <div className="d-flex gap-3">
              <div className="text-center">
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                  {Math.round(rideProgress)}%
                </div>
                <div className="text-muted small">Progress</div>
              </div>
              <div className="text-center">
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                  {rideETA} min
                </div>
                <div className="text-muted small">ETA</div>
              </div>
              <div className="text-center">
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                  {totalDistance.toFixed(1)} km
                </div>
                <div className="text-muted small">Total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="alert alert-success animate-fadeIn mb-3">
          <FiCheck className="me-2" /> <strong>Ride Completed!</strong> You have successfully reached your destination.
          <Link to="/discover" className="btn btn-sm btn-outline-success ms-3">Find more rides</Link>
        </div>
      )}

      {error && <div className="alert alert-warning mb-3 py-2">{error}</div>}

      {/* Floating Alerts Container */}
      <div className="floating-alerts-container">
        {activeAlerts.map(alert => (
          <div key={alert.id} className={`floating-alert alert-${alert.type} animate-slideInRight`}>
            {alert.message}
            <button className="btn-close ms-2" onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}></button>
          </div>
        ))}
      </div>

      {/* Ride Selector */}
      <div className="ride-selector mb-3">
        <label className="form-label mb-1 small">Select Active Ride</label>
        <select
          className="form-control"
          value={selectedRideId}
          onChange={(e) => setSelectedRideId(e.target.value)}
          disabled={isTracking}
          style={{ maxWidth: 400 }}
        >
          <option value="">— Choose a ride to track —</option>
          {rides.map(r => (
            <option key={r.id} value={r.id}>
              {r.title} ({r.status})
            </option>
          ))}
        </select>
      </div>

      {/* My GPS Info (real mode only) */}
      {!useSimulation && currentMyLocation && (
        <div className="my-gps-bar mb-3">
          <div className="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
            <span><FiMapPin size={14} className="text-accent" /> <strong>{currentMyLocation.lat.toFixed(4)}, {currentMyLocation.lng.toFixed(4)}</strong></span>
            {currentMyLocation.speed > 0 && <span>Speed: <strong>{currentMyLocation.speed} km/h</strong></span>}
            {selectedRide && destLat && (
              <span className="badge bg-primary-soft text-accent">
                🏁 {destDistance < 1 ? `${(destDistance * 1000).toFixed(0)} m` : `${destDistance.toFixed(1)} km`} to destination
              </span>
            )}
          </div>
          <div className="text-muted small">±{currentMyLocation.accuracy?.toFixed(0)}m accuracy</div>
        </div>
      )}

      {/* Lag Alert */}
      {laggingRiders.length > 0 && (
        <div className="lag-alert animate-fadeIn mb-3">
          <FiAlertTriangle size={18} />
          <div>
            <strong>Lag Detected!</strong>
            <span>{laggingRiders.map(r => r.name).join(', ')} {laggingRiders.length === 1 ? 'is' : 'are'} more than {LAG_THRESHOLD_KM} km behind the group.</span>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Map */}
        <div className="col-lg-8">
          <div className="tracking-map-card">
            {selectedRide && (
              <div className="tracking-map-header d-flex justify-content-between align-items-center">
                <span>🏍️ {selectedRide.title}</span>
                <div className="d-flex align-items-center gap-3">
                  {selectedRide.status === 'upcoming' && isOrganizer && (
                    <button className="btn btn-success btn-sm py-0 px-2" style={{fontSize:'0.75rem'}} onClick={handleStartRide} disabled={startLoading}>
                      {startLoading ? '...' : 'Start Ride Now'}
                    </button>
                  )}
                  <span className="text-muted small">{isTracking ? `${allRiders.length} rider(s) tracked` : 'Not tracking'}</span>
                </div>
              </div>
            )}
            <div className="tracking-map">
              <ModernMap
                center={[centerLat, centerLng]}
                zoom={14}
                bounds={mapBounds}
                markers={[
                  ...mapMarkers,
                  ...fuelStations.map(s => ({
                    position: [s.lat, s.lng],
                    type: 'fuel',
                    color: '#FACC15',
                    label: s.name
                  }))
                ]}
                polyline={(selectedRide?.route_coords || selectedRide?.routeCoords)?.map(c => [c[1], c[0]])}
                interactive={true}
              />
              
              {/* Empty state */}
              {!isTracking && allRiders.length === 0 && (
                <div className="map-empty">
                  <FiNavigation size={32} className="text-muted mb-2" />
                  <p className="text-muted small">Select a ride and press Start Tracking</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rider List */}
        <div className="col-lg-4">
          <div className="rider-list-card">
            <h4 className="widget-title">
              <FiUsers size={16} className="me-2" />
              Riders ({allRiders.length})
            </h4>
            {allRiders.length === 0 ? (
              <p className="text-muted small text-center py-3">
                {isTracking ? 'No other riders tracked yet...' : 'Start tracking to see riders'}
              </p>
            ) : (
              <div className="rider-list">
                {allRiders.map(rider => (
                  <div
                    key={rider.id}
                    className={`rider-item ${rider.lagging ? 'lagging' : ''} ${selectedRider === rider.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRider(rider.id)}
                  >
                    <div className="rider-dot" style={{ background: rider.color }}></div>
                    <div className="rider-info">
                      <div className="rider-name d-flex align-items-center gap-1">
                        {rider.name}
                        {rider.isOrganizer && <span className="badge bg-dark-soft smaller">Leader</span>}
                      </div>
                      <div className="rider-meta d-flex gap-2 align-items-center">
                        <span className="rider-speed small">
                          {rider.speed ? `${Number(rider.speed).toFixed(0)} km/h` : '—'}
                        </span>
                        {!rider.isOrganizer && (
                          <span className={`rider-distance smaller ${riderDistances[rider.id] > LAG_THRESHOLD_KM ? 'text-danger fw-bold' : 'text-muted'}`}>
                            • {(riderDistances[rider.id] || 0).toFixed(1)} km from leader
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rider-status">
                      {rider.isOrganizer ? (
                        <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>HQ</span>
                      ) : (riderDistances[rider.id] || 0) > LAG_THRESHOLD_KM ? (
                        <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                          <FiAlertTriangle size={10} className="me-1" />FAR
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>NEAR</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected rider detail */}
            {selectedRider && (() => {
              const r = allRiders.find(x => x.id === selectedRider)
              if (!r) return null
              return (
                <div className="rider-detail-panel mt-3">
                  <h5 className="mb-2">{r.name}</h5>
                  <div className="detail-grid">
                    <div><span className="text-muted">Speed</span><br /><strong>{r.speed ? `${Number(r.speed).toFixed(0)} km/h` : '—'}</strong></div>
                    <div><span className="text-muted">Lat</span><br /><strong>{r.lat.toFixed(5)}</strong></div>
                    <div><span className="text-muted">Lng</span><br /><strong>{r.lng.toFixed(5)}</strong></div>
                    <div>
                      <span className="text-muted">Status</span><br />
                      <strong style={{ color: r.lagging ? '#EF4444' : '#22C55E' }}>
                        {r.lagging ? 'Lagging' : 'On Track'}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            })()}

            {isTracking && isOrganizer && (
              <button 
                className="btn btn-outline-danger w-100 mt-4 btn-sm" 
                onClick={() => { if(window.confirm('End ride manually?')) handleCompleteRide() }}
              >
                End Ride Manually
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .simulation-controls {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .gps-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
        }
        .gps-idle { background: rgba(112,112,112,0.15); color: #707070; }
        .gps-acquiring { background: rgba(250,204,21,0.15); color: #FACC15; }
        .gps-active { background: rgba(34,197,94,0.15); color: #22C55E; }
        .gps-denied { background: rgba(239,68,68,0.15); color: #EF4444; }
        .my-gps-bar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-sm); padding: 0.6rem 1rem; font-size: 0.85rem;
        }
        .lag-alert {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-md); padding: 1rem 1.25rem;
          display: flex; align-items: flex-start; gap: 12px; color: #EF4444;
        }
        .lag-alert span { display: block; color: var(--text-secondary); font-size: 0.85rem; }
        .tracking-map-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); overflow: hidden;
        }
        .tracking-map-header {
          display: flex; justify-content: space-between; padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color); font-size: 0.9rem; font-weight: 600;
        }
        .tracking-map {
          height: 500px; background: #0f0f1e; position: relative; overflow: hidden;
        }
        .map-empty {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; z-index: 2;
        }
        .rider-list-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.25rem;
        }
        .rider-list { display: flex; flex-direction: column; gap: 4px; }
        .rider-item {
          display: flex; align-items: center; gap: 10px;
          padding: 0.6rem 0.75rem; border-radius: var(--radius-sm);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .rider-item:hover, .rider-item.selected { background: rgba(255,107,0,0.08); }
        .rider-item.lagging { border-left: 3px solid #EF4444; }
        .rider-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .rider-info { flex: 1; }
        .rider-name { font-size: 0.9rem; font-weight: 600; }
        .rider-speed { font-size: 0.75rem; color: var(--text-muted); }
        .rider-detail-panel {
          background: var(--bg-input); border-radius: var(--radius-sm); padding: 1rem;
        }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem; }
        .widget-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .floating-alerts-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
        }
        .floating-alert {
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
        }
        .alert-warning { background: rgba(180, 83, 9, 0.95); border-color: #f59e0b; }
        .alert-success { background: rgba(21, 128, 61, 0.95); border-color: #22c55e; }
        .bg-dark-soft { background: rgba(255,255,255,0.1); color: #ccc; }
        .rider-item.selected { border-color: var(--primary); background: rgba(255,107,0,0.05); }
      `}</style>
    </DashboardLayout>
  )
}

export default LiveTracking
