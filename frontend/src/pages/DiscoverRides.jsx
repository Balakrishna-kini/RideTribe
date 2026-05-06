import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiFilter, FiCompass } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import RideCard from '../components/RideCard'
import rideService from '../services/rideService'

const DiscoverRides = () => {
  const [rides, setRides] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRides()
  }, [])

  const fetchRides = async () => {
    try {
      const data = await rideService.getRides()
      setRides(data)
    } catch (err) {
      setError('Failed to load rides. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = rides.filter(r => {
    const matchesSearch = !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.startLocation?.toLowerCase().includes(search.toLowerCase()) ||
      r.endLocation?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statuses = ['all', 'upcoming', 'active', 'completed']

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1><FiCompass className="text-accent" /> Discover Rides</h1>
        <p>Find your next adventure</p>
      </div>

      <div className="discover-filters mb-4">
        <div className="search-box">
          <FiSearch size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search rides, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {statuses.map(s => (
            <button
              key={s}
              className={`chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <FiCompass size={40} className="text-muted mb-2" />
          <p className="text-muted">{rides.length === 0 ? 'No rides yet. Create the first ride!' : 'No rides match your filters.'}</p>
          <Link to="/create-ride" className="btn btn-primary">Create a Ride</Link>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(ride => (
            <div className="col-md-6 col-lg-4" key={ride.id}>
              <RideCard ride={ride} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .discover-filters {
          display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;
        }
        .search-box {
          position: relative; flex: 1; min-width: 250px;
        }
        .search-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted);
        }
        .search-box .form-control { padding-left: 2.5rem; }
        .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .chip {
          padding: 6px 16px; border-radius: var(--radius-full);
          font-size: 0.8rem; font-weight: 600; border: 1px solid var(--border-color);
          background: var(--bg-card); color: var(--text-secondary); cursor: pointer;
          transition: all var(--transition-fast);
        }
        .chip:hover { border-color: var(--primary); color: var(--primary); }
        .chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
      `}</style>
    </DashboardLayout>
  )
}

export default DiscoverRides
