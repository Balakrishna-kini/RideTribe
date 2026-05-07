import React, { useState, useEffect } from 'react'
import { FiUser, FiMapPin, FiEdit3, FiTrendingUp, FiNavigation, FiTrash2 } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import authService from '../services/authService'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    fetchProfile()
    fetchVehicles()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await authService.getProfile()
      setUser(data)
      setEditData(data)
    } catch (err) {
      setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const data = await authService.getVehicles()
      setVehicles(data)
    } catch (err) {}
  }

  const startEdit = () => {
    setEditData(user)
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      // Map frontend camelCase to backend snake_case if necessary
      // But UserSerializer handles snake_case directly
      const updateData = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
        location: editData.location,
        bio: editData.bio,
        riding_style: editData.riding_style,
        favorite_bike: editData.favorite_bike
      }
      
      const updatedUser = await authService.updateProfile(updateData)
      setUser(updatedUser)
      setEditing(false)
      setSuccess('Profile updated successfully!')
      
      // Auto clear success message
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('❌ Error saving profile:', err)
      setError('Unable to save profile. Please check your inputs.')
    } finally {
      setSaving(false)
    }
  }

  const deleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return
    try {
      await authService.deleteVehicle(id)
      setVehicles(vehicles.filter(v => v.id !== id))
    } catch (err) {
      setError('Failed to delete vehicle.')
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    </DashboardLayout>
  )

  if (!user) return (
    <DashboardLayout>
      <div className="alert alert-danger">User profile not found. Please log in again.</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1><FiUser className="text-accent" /> My Profile</h1>
        <p>Manage your rider identity</p>
      </div>

      {success && <div className="alert alert-success animate-fadeIn">{success}</div>}
      {error && <div className="alert alert-danger animate-fadeIn">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="profile-sidebar">
            <div className="profile-avatar">{user.first_name ? user.first_name[0] : user.username[0]}</div>
            <h3 className="profile-name">{user.first_name} {user.last_name}</h3>
            <p className="profile-email">{user.email}</p>
            {user.location && <p className="profile-loc"><FiMapPin size={14} /> {user.location}</p>}
            <p className="profile-bio">{user.bio || 'No bio added yet.'}</p>
            
            <div className="mt-3 pt-3 border-top text-start">
              <div className="mb-2"><span className="text-muted small">Style:</span> <span className="small fw-bold">{user.riding_style || 'Not set'}</span></div>
              <div className="mb-2"><span className="text-muted small">Favorite Bike:</span> <span className="small fw-bold">{user.favorite_bike || 'Not set'}</span></div>
            </div>

            <button 
              className={`btn ${editing ? 'btn-primary' : 'btn-outline-primary'} w-100 mt-3`} 
              onClick={editing ? saveProfile : startEdit}
              disabled={saving}
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : <><FiEdit3 className="me-1" /> Edit Profile</>}
            </button>
            {editing && (
              <button className="btn btn-link btn-sm w-100 mt-2 text-muted" onClick={() => setEditing(false)}>Cancel</button>
            )}
          </div>
        </div>

        <div className="col-lg-8">
          {editing && (
            <div className="edit-panel mb-4 animate-fadeIn">
              <h4 className="widget-title mb-3">Update Profile Details</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={editData.first_name || ''} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={editData.last_name || ''} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-control" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Riding Style</label>
                  <select className="form-control" value={editData.riding_style || ''} onChange={(e) => setEditData({ ...editData, riding_style: e.target.value })}>
                    <option value="">Select style</option>
                    <option value="Cruiser">Cruiser</option>
                    <option value="Sport">Sport</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Off-road">Off-road</option>
                    <option value="Touring">Touring</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Favorite Bike</label>
                  <input type="text" className="form-control" placeholder="e.g. BMW R1250GS" value={editData.favorite_bike || ''} onChange={(e) => setEditData({ ...editData, favorite_bike: e.target.value })} />
                </div>
                <div className="col-12">
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" rows={3} value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Ride Stats */}
          <div className="stats-row mb-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}><FiNavigation size={20} /></div>
              <div>
                <div className="stat-value">{user.total_rides || user.totalRides || 0}</div>
                <div className="stat-label">Total Rides</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}><FiTrendingUp size={20} /></div>
              <div>
                <div className="stat-value">{user.total_distance || user.totalDistance || 0} km</div>
                <div className="stat-label">Distance</div>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div className="vehicles-section">
            <h4 className="widget-title mb-3">🏍️ My Bikes</h4>
            {vehicles.length === 0 ? (
              <p className="text-muted">No vehicles added yet.</p>
            ) : (
              <div className="vehicle-grid">
                {vehicles.map(v => (
                  <div key={v.id} className="vehicle-card">
                    <div className="vehicle-emoji">🏍️</div>
                    <div className="flex-grow-1">
                      <div className="fw-600">{v.name}</div>
                      <div className="text-muted small">{v.vehicleType} • {v.mileage} km/l</div>
                    </div>
                    <button className="btn btn-sm" style={{ color: '#EF4444' }} onClick={() => deleteVehicle(v.id)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-sidebar {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 2rem; text-align: center;
        }
        .profile-avatar {
          width: 80px; height: 80px; border-radius: var(--radius-full);
          background: rgba(255,107,0,0.15); color: var(--primary);
          font-size: 2rem; font-weight: 800; display: inline-flex;
          align-items: center; justify-content: center; margin-bottom: 1rem;
        }
        .profile-name { font-size: 1.2rem; font-weight: 800; margin-bottom: 0.2rem; }
        .profile-email { font-size: 0.85rem; color: var(--text-muted); }
        .profile-loc { font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; justify-content: center; }
        .profile-bio { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem; }
        .edit-panel {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.5rem;
        }
        .stats-row { display: flex; gap: 1rem; }
        .stat-card {
          flex: 1; background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; gap: 12px;
        }
        .stat-icon {
          width: 44px; height: 44px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
        }
        .stat-value { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--primary); }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); }
        .vehicles-section {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.5rem;
        }
        .vehicle-grid { display: flex; flex-direction: column; gap: 8px; }
        .vehicle-card {
          display: flex; align-items: center; gap: 10px;
          padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }
        .vehicle-emoji { font-size: 1.3rem; }
        .widget-title { font-size: 0.95rem; font-weight: 700; }
        .fw-600 { font-weight: 600; }
      `}</style>
    </DashboardLayout>
  )
}

export default Profile
