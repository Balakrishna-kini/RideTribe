import React, { useState, useEffect } from 'react'
import { FiMapPin, FiNavigation, FiSearch } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import ModernMap from '../components/ModernMap'
import { haversine } from '../utils/rideUtils'
import rideService from '../services/rideService'

const FuelFinder = () => {
  const navigate = useNavigate()
  const [location, setLocation] = useState(null)
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [selectedStationId, setSelectedStationId] = useState(null)
  const [mapState, setMapState] = useState({ center: [12.9716, 77.5946], zoom: 13 })
  const [locationStatus, setLocationStatus] = useState('idle')

  useEffect(() => {
    // 1. Check for active simulation state first
    const savedState = JSON.parse(sessionStorage.getItem('rt_live_tracking_state') || '{}')
    
    if (savedState.useSimulation && savedState.simulatedRiders?.length > 0) {
      const rider = savedState.simulatedRiders[0]
      const simLoc = { lat: rider.lat, lng: rider.lng }
      console.log('🎮 Using simulated position for Fuel Finder:', simLoc)
      setLocation(simLoc)
      setLocationStatus('granted')
      setMapState({ center: [simLoc.lat, simLoc.lng], zoom: 14 })
      return // Don't use real GPS if simulation is active
    }

    // 2. Fallback to real GPS
    setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(loc)
        setLocationStatus('granted')
        setMapState({ center: [loc.lat, loc.lng], zoom: 14 })
      },
      (err) => {
        console.warn('⚠️ Real location permission denied:', err)
        setLocationStatus('denied')
        setError('Please enable location access to find nearby fuel stations.')
      },
      { timeout: 10000 }
    )
  }, [])

  const findFuel = async () => {
    if (!location) {
      setError('Location not available. Please enable location services.')
      return
    }
    
    setScanning(true)
    setLoading(true)
    setError('')
    setSelectedStationId(null)
    
    try {
      console.log('🔍 Scanning for fuel stations near:', location)
      const radius = 8000
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="fuel"](around:${radius},${location.lat},${location.lng});
          way["amenity"="fuel"](around:${radius},${location.lat},${location.lng});
          relation["amenity"="fuel"](around:${radius},${location.lat},${location.lng});
        );
        out center;
      `
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error('Failed to fetch from Overpass API')
      }
      
      const data = await res.json()
      
      const results = (data.elements || []).map(el => {
        const lat = el.lat || (el.center && el.center.lat)
        const lng = el.lon || (el.center && el.center.lon)
        
        if (!lat || !lng) return null
        
        const dist = haversine(location.lat, location.lng, lat, lng)
        return {
          id: el.id,
          lat: lat,
          lng: lng,
          name: el.tags.name || 'Fuel Station',
          brand: el.tags.brand || 'Local',
          address: el.tags['addr:full'] || el.tags['addr:street'] || 'Nearby',
          distance: dist
        }
      }).filter(Boolean)
      
      console.log('⛽ Fuel stations found:', results.length)
      
      results.sort((a, b) => a.distance - b.distance)
      
      setStations(results)
      if (results.length === 0) {
        setError('No fuel stations found within 8km.')
      }
    } catch (err) {
      console.error('❌ Error fetching fuel stations:', err)
      setError('Failed to fetch fuel stations. Please try again.')
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }

  const handleSelectStation = (s) => {
    console.log('📍 Station selected:', s)
    setSelectedStationId(s.id)
    setMapState({ center: [s.lat, s.lng], zoom: 16 })
  }

  const handleNavigate = async (s) => {
    if (!location) {
      setError('Location not available. Please enable location services first.')
      return
    }
    
    console.log('🧭 Starting navigation to fuel station:', s)
    setLoading(true)
    
    try {
      const origin = `${location.lat},${location.lng}`
      const destination = `${s.lat},${s.lng}`
      console.log('🛣️ Fetching route:', { origin, destination })
      
      const distanceData = await rideService.getDistance(origin, destination)
      console.log('✅ Route fetched:', distanceData)
      
      const routeCoords = distanceData.route_coords || distanceData.routeCoords || []
      console.log('📍 Route coords length:', routeCoords.length)
      
      if (routeCoords.length === 0) {
        console.error('❌ No route coordinates found in:', distanceData)
        setError('Could not generate route. Please try again.')
        return
      }
      
      const navigationData = {
        title: `Fuel Stop: ${s.name}`,
        start_lat: location.lat,
        start_lng: location.lng,
        end_lat: s.lat,
        end_lng: s.lng,
        route_coords: routeCoords
      }
      
      const stateKey = 'navigationData_' + Date.now()
      sessionStorage.setItem(stateKey, JSON.stringify(navigationData))
      navigate(`/navigation/direct/${stateKey}`)
      
    } catch (err) {
      console.error('❌ Error starting navigation:', err)
      setError('Failed to start navigation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const markers = [
    ...(location ? [{ position: [location.lat, location.lng], type: 'rider', color: '#3B82F6' }] : []),
    ...stations.map(s => ({
      position: [s.lat, s.lng],
      type: 'fuel',
      color: s.id === selectedStationId ? '#FF6B00' : '#FACC15',
      label: s.name
    }))
  ]

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>⛽ Nearby Fuel Finder</h1>
        <p>Find the closest gas stations for your ride</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="fuel-controls-card p-4 mb-4">
            <button 
              className="btn btn-primary w-100 mb-3 py-2" 
              onClick={findFuel} 
              disabled={scanning || loading || !location}
            >
              {scanning ? (
                <><span className="spinner-border spinner-border-sm me-2" /> Scanning nearby fuel stations...</>
              ) : (
                <><FiSearch className="me-2" /> Scan for Fuel Stations</>
              )}
            </button>
            
            {locationStatus === 'requesting' && (
              <div className="alert alert-info py-2 small">
                <span className="spinner-border spinner-border-sm me-2" /> Requesting location access...
              </div>
            )}
            
            {locationStatus === 'denied' && !error && (
              <div className="alert alert-warning py-2 small">
                ⚠️ Location permission denied. Please enable location services to use Fuel Finder.
              </div>
            )}
            
            {error && <div className="alert alert-warning py-2 small">{error}</div>}
            
            <div className="station-list mt-3">
              <h6 className="text-muted small text-uppercase fw-bold mb-3 d-flex justify-content-between">
                <span>Results ({stations.length})</span>
                {stations.length > 0 && <span className="text-accent cursor-pointer" onClick={() => setStations([])}>Clear</span>}
              </h6>
              {stations.map((s, idx) => {
                const travelTime = Math.round((s.distance / 30) * 60)
                return (
                  <div 
                    key={s.id} 
                    className={`station-item p-3 mb-2 ${selectedStationId === s.id ? 'selected' : ''}`}
                    onClick={() => handleSelectStation(s)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="fw-bold">{s.name}</div>
                      {idx === 0 && <span className="badge bg-success-soft text-success smaller">Nearest</span>}
                    </div>
                    <div className="text-muted small d-flex justify-content-between">
                      <span>{s.brand}</span>
                      <span className="text-accent fw-bold">{s.distance.toFixed(1)} km • {travelTime} min</span>
                    </div>
                    <div className="text-muted smaller mt-1 mb-2"><FiMapPin size={10} /> {s.address}</div>
                    <button 
                      className="btn btn-primary btn-sm w-100 mt-1 py-1" 
                      onClick={(e) => { e.stopPropagation(); handleNavigate(s); }}
                      disabled={loading}
                    >
                      <FiNavigation size={12} className="me-1" /> Navigate
                    </button>
                  </div>
                )
              })}
              {stations.length === 0 && !scanning && !loading && (
                <div className="text-center py-4 text-muted small">
                  Click the button above to search around your area.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="fuel-map-container position-relative">
            <ModernMap 
              center={mapState.center}
              zoom={mapState.zoom}
              markers={markers}
              height="600px"
            />
          </div>
        </div>
      </div>

      <style>{`
        .fuel-controls-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .fuel-map-container {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #111;
        }
        .station-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .station-item:hover, .station-item.selected {
          border-color: var(--primary);
          background: rgba(255,107,0,0.05);
        }
        .station-item.selected {
          box-shadow: 0 0 0 1px var(--primary);
        }
        .smaller { font-size: 0.75rem; }
        .bg-success-soft { background: rgba(34,197,94,0.15); }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </DashboardLayout>
  )
}

export default FuelFinder
