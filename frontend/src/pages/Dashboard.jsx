import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiMapPin, FiUsers, FiNavigation, FiCalendar, FiTrendingUp, FiPlusCircle, FiArrowRight, FiSun, FiCloud, FiCloudRain, FiWind } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import RideCard from '../components/RideCard'
import rideService from '../services/rideService'
import authService from '../services/authService'

// Open-Meteo free weather API (no key needed)
const fetchWeather = async (lat, lon) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`
  const res = await fetch(url)
  const data = await res.json()
  return data
}

// WMO weather code → label + emoji
const weatherLabel = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' }
  if (code <= 2) return { label: 'Partly Cloudy', icon: '⛅' }
  if (code === 3) return { label: 'Overcast', icon: '☁️' }
  if (code <= 49) return { label: 'Foggy', icon: '🌫️' }
  if (code <= 59) return { label: 'Drizzle', icon: '🌦️' }
  if (code <= 69) return { label: 'Rain', icon: '🌧️' }
  if (code <= 79) return { label: 'Snow', icon: '❄️' }
  if (code <= 84) return { label: 'Showers', icon: '🌧️' }
  if (code <= 99) return { label: 'Thunderstorm', icon: '⛈️' }
  return { label: 'Unknown', icon: '🌡️' }
}

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weather, setWeather] = useState(null)
  const [weatherCity, setWeatherCity] = useState('Your Location')
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const user = authService.getCurrentUser()

  useEffect(() => {
    const fetchDashboardData = async () => {
      const startTime = performance.now()
      try {
        const data = await rideService.getDashboardSummary()
        setSummary(data)
        setLoading(false)
        setError(null)
        console.log(`📊 Dashboard API loaded in ${Math.round(performance.now() - startTime)}ms`)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        if (retryCount < 3) {
          console.log(`🔄 Retrying dashboard fetch... (Attempt ${retryCount + 1})`)
          setTimeout(() => setRetryCount(prev => prev + 1), 3000)
        } else {
          setError('Server is taking a while to wake up. Please refresh.')
          setLoading(false)
        }
      }
    }
    fetchDashboardData()
  }, [retryCount])

  // Live weather via browser geolocation + Open-Meteo
  useEffect(() => {
    const getWeather = async (lat, lon, city = 'Your Location') => {
      try {
        const data = await fetchWeather(lat, lon)
        setWeather(data.current_weather)
        setWeatherCity(city)
      } catch {}
      finally { setWeatherLoading(false) }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            const place = await r.json()
            const city = place.address?.city || place.address?.town || place.address?.state || 'Your Location'
            getWeather(latitude, longitude, city)
          } catch {
            getWeather(latitude, longitude)
          }
        },
        () => getWeather(12.9716, 77.5946, 'Bangalore, KA')
      )
    } else {
      getWeather(12.9716, 77.5946, 'Bangalore, KA')
    }
  }, [])

  const statsData = summary?.stats || {}
  
  const stats = [
    { icon: FiNavigation, label: 'Total Rides', value: statsData.totalRides ?? '—', color: '#FF6B00' },
    { icon: FiMapPin, label: 'Distance', value: statsData.totalDistance ? `${statsData.totalDistance.toLocaleString()} km` : '—', color: '#3B82F6' },
    { icon: FiUsers, label: 'Riding Buddies', value: statsData.ridingBuddies ?? '—', color: '#22C55E' },
    { icon: FiTrendingUp, label: 'This Month', value: statsData.monthlyRides ? `${statsData.monthlyRides} ride${statsData.monthlyRides !== 1 ? 's' : ''}` : '—', color: '#FACC15' },
  ]

  const upcomingRides = summary?.upcomingRides || []
  const recentActivity = (summary?.recentActivity || []).map(a => ({
    text: a.message,
    time: new Date(a.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    color: a.type.includes('join') ? '#22C55E' : a.type.includes('alert') ? '#EF4444' : '#FF6B00',
  }))

  const wInfo = weather ? weatherLabel(weather.weathercode) : null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Welcome back, <span className="text-accent">{user?.firstName || user?.first_name || 'Rider'}</span> 👋</h1>
        <p>Here's what's happening in your riding world</p>
      </div>

      {error && (
        <div className="alert alert-warning animate-fadeIn mb-4 d-flex align-items-center gap-3">
          <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
          <div>{error}</div>
        </div>
      )}

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div className="col-6 col-lg-3" key={i}>
              <div className="stat-card animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                {loading ? (
                  <div className="skeleton-stat shimmer"></div>
                ) : (
                  <div className="d-flex align-items-center gap-3">
                    <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="row g-4">
        {/* Rides Section */}
        <div className="col-lg-8">
          {/* Active Rides */}
          {summary?.activeRides?.length > 0 && (
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="section-heading text-primary">🔴 Active Rides</h3>
                <Link to="/live-tracking" className="btn btn-outline-primary btn-sm">
                  Track <FiArrowRight size={13} />
                </Link>
              </div>
              <div className="row g-3">
                {summary.activeRides.map(ride => (
                  <div className="col-md-6" key={ride.id}>
                    <RideCard ride={ride} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Rides */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="section-heading">Upcoming Rides</h3>
              <Link to="/discover" className="btn btn-dark btn-sm">View All</Link>
            </div>
            {loading ? (
              <div className="row g-3">
                <div className="col-md-6"><RideCard loading={true} /></div>
                <div className="col-md-6"><RideCard loading={true} /></div>
              </div>
            ) : upcomingRides.length > 0 ? (
              <div className="row g-3">
                {upcomingRides.map(ride => (
                  <div className="col-md-6" key={ride.id}>
                    <RideCard ride={ride} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-rides-card">
                <FiNavigation size={28} className="text-muted mb-2" />
                <p className="text-muted small mb-2">No upcoming rides yet</p>
                <Link to="/create-ride" className="btn btn-primary btn-sm">
                  <FiPlusCircle className="me-1" /> Create First Ride
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="col-lg-4">
          {/* Quick Actions */}
          <div className="widget-card mb-4">
            <h4 className="widget-title">Quick Actions</h4>
            <div className="d-grid gap-2">
              <Link to="/create-ride" className="btn btn-primary">
                <FiPlusCircle className="me-2" /> Create New Ride
              </Link>
              <Link to="/discover" className="btn btn-dark">
                <FiNavigation className="me-2" /> Discover Rides
              </Link>
            </div>
          </div>

          {/* Live Weather Widget */}
          <div className="widget-card mb-4">
            <h4 className="widget-title">🌤 Live Weather</h4>
            {weatherLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted small">
                <span className="spinner-border spinner-border-sm" /> Fetching weather...
              </div>
            ) : weather && wInfo ? (
              <>
                <div className="weather-display">
                  <div className="weather-icon-big">{wInfo.icon}</div>
                  <div>
                    <div className="weather-temp">{Math.round(weather.temperature)}°C</div>
                    <div className="weather-info">
                      <span>{wInfo.label}</span>
                      <span className="text-muted">{weatherCity}</span>
                      <span className="text-muted small">
                        <FiWind size={11} /> {Math.round(weather.windspeed)} km/h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="weather-riding-tip mt-2">
                  {weather.weathercode <= 2
                    ? '✅ Great day to ride!'
                    : weather.weathercode <= 49
                    ? '⚠️ Be cautious — foggy conditions'
                    : '❌ Rain ahead — consider rescheduling'}
                </div>
              </>
            ) : (
              <p className="text-muted small">Weather unavailable</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="widget-card">
            <h4 className="widget-title">Recent Activity</h4>
            {loading ? (
              <div className="skeleton-activity">
                <div className="skeleton-line shimmer mb-2" style={{ width: '90%' }}></div>
                <div className="skeleton-line shimmer mb-2" style={{ width: '70%' }}></div>
                <div className="skeleton-line shimmer" style={{ width: '80%' }}></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: a.color }}></div>
                    <div className="activity-content">
                      <span>{a.text}</span>
                      <span className="activity-time">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small">No activity yet — create or join a ride!</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .section-heading { font-size: 1.1rem; font-weight: 700; margin: 0; }
        .empty-rides-card {
          background: var(--bg-card); border: 1px dashed var(--border-color);
          border-radius: var(--radius-md); padding: 2rem;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .widget-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.25rem;
        }
        .widget-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; }
        .weather-display { display: flex; align-items: center; gap: 12px; }
        .weather-icon-big { font-size: 2.5rem; line-height: 1; }
        .weather-temp {
          font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--primary);
        }
        .weather-info { display: flex; flex-direction: column; gap: 2px; font-size: 0.85rem; }
        .weather-riding-tip {
          font-size: 0.8rem; padding: 0.4rem 0.75rem; border-radius: var(--radius-sm);
          background: var(--bg-input); color: var(--text-secondary); margin-top: 0.5rem;
        }
        .activity-list { display: flex; flex-direction: column; gap: 12px; }
        .activity-item { display: flex; align-items: flex-start; gap: 10px; }
        .activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
        .activity-content { display: flex; flex-direction: column; font-size: 0.85rem; }
        .activity-time { color: var(--text-muted); font-size: 0.75rem; }
        
        /* Skeleton Shimmer */
        .shimmer {
          background: linear-gradient(90deg, var(--bg-input) 25%, var(--border-color) 50%, var(--bg-input) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-stat { height: 40px; width: 100%; border-radius: 8px; }
        .skeleton-line { height: 12px; border-radius: 4px; background: var(--bg-input); }
        .skeleton-activity { padding: 5px 0; }
      `}</style>
    </DashboardLayout>
  )
}

export default Dashboard
