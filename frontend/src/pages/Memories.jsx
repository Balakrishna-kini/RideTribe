import React, { useState, useEffect, useRef } from 'react'
import { FiCamera, FiHeart, FiUpload, FiX, FiImage, FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import memoryService from '../services/memoryService'
import rideService from '../services/rideService'

const Memories = () => {
  const [rides, setRides] = useState([])
  const [memoriesByRide, setMemoriesByRide] = useState({})  // rideId -> memories[]
  const [globalMemories, setGlobalMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadRideId, setUploadRideId] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadData, setUploadData] = useState({ image: null, caption: '' })
  const [uploading, setUploading] = useState(false)
  const [expandedRides, setExpandedRides] = useState({})
  const fileRef = useRef()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [ridesData, allMemories] = await Promise.all([
        rideService.getRides(),
        memoryService.getMemories(),
      ])
      setRides(ridesData)

      // Group memories by ride
      const grouped = {}
      const unassigned = []
      allMemories.forEach(m => {
        if (m.ride) {
          if (!grouped[m.ride]) grouped[m.ride] = []
          grouped[m.ride].push(m)
        } else {
          unassigned.push(m)
        }
      })
      setMemoriesByRide(grouped)
      setGlobalMemories(unassigned)

      // Default: expand first ride with memories
      if (ridesData.length > 0) {
        setExpandedRides({ [ridesData[0].id]: true })
      }
    } catch (err) {
      setError('Failed to load memories')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadData.image) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', uploadData.image)
      fd.append('caption', uploadData.caption)
      if (uploadRideId) fd.append('ride', uploadRideId)
      const newMemory = await memoryService.uploadMemory(fd)

      if (newMemory.ride) {
        setMemoriesByRide(prev => ({
          ...prev,
          [newMemory.ride]: [newMemory, ...(prev[newMemory.ride] || [])],
        }))
        setExpandedRides(prev => ({ ...prev, [newMemory.ride]: true }))
      } else {
        setGlobalMemories(prev => [newMemory, ...prev])
      }
      setShowUpload(false)
      setUploadData({ image: null, caption: '' })
      setUploadRideId('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError('Failed to upload memory')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, rideId) => {
    try {
      await memoryService.deleteMemory(id)
      if (rideId) {
        setMemoriesByRide(prev => ({
          ...prev,
          [rideId]: (prev[rideId] || []).filter(m => m.id !== id),
        }))
      } else {
        setGlobalMemories(prev => prev.filter(m => m.id !== id))
      }
    } catch (err) {
      setError('Failed to delete memory')
    }
  }

  const handleLike = async (id, rideId) => {
    try {
      const result = await memoryService.likeMemory(id)
      const updateList = list => list.map(m => m.id === id ? { ...m, likes: result.likes } : m)
      if (rideId) {
        setMemoriesByRide(prev => ({ ...prev, [rideId]: updateList(prev[rideId] || []) }))
      } else {
        setGlobalMemories(prev => updateList(prev))
      }
    } catch {}
  }

  const handleDownload = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'ridertribe_memory.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Fallback: direct link if fetch fails (CORS issue)
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = filename || 'ridertribe_memory.jpg';
      a.target = '_blank';
      a.click();
    }
  }

  const handleDownloadAll = async (memories, albumName) => {
    for (let i = 0; i < memories.length; i++) {
      const m = memories[i];
      if (m.image) {
        const ext = m.image.split('.').pop().split('?')[0] || 'jpg';
        const name = `${albumName.replace(/\s+/g, '_')}_${i + 1}.${ext}`;
        await handleDownload(m.image, name);
        // Add small delay to prevent browser blocking multiple downloads
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  const toggleRide = (rideId) => {
    setExpandedRides(prev => ({ ...prev, [rideId]: !prev[rideId] }))
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const MemoryGrid = ({ memories, rideId }) => (
    <div className="memory-grid">
      {memories.map(m => (
        <div key={m.id} className="memory-card">
          {m.image ? (
            <div className="memory-img" style={{ backgroundImage: `url(${m.image})` }}>
              <div className="memory-actions">
                <button 
                  className="memory-action-btn download" 
                  onClick={() => handleDownload(m.image, `memory_${m.id}.jpg`)}
                  title="Download photo"
                >
                  <FiDownload size={14} />
                </button>
                <button 
                  className="memory-action-btn delete" 
                  onClick={() => handleDelete(m.id, rideId)}
                  title="Delete memory"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="memory-img memory-img-placeholder">
              <FiImage size={32} className="text-muted" />
            </div>
          )}
          <div className="memory-info">
            <p className="memory-caption">{m.caption || 'Untitled memory'}</p>
            <div className="memory-meta">
              <button
                className="like-btn"
                onClick={() => handleLike(m.id, rideId)}
              >
                <FiHeart size={13} /> {m.likes || 0}
              </button>
              <span>{formatDate(m.createdAt || m.created_at)}</span>
            </div>
            <span className="memory-author">{m.userName || m.user_name || 'Rider'}</span>
          </div>
        </div>
      ))}
    </div>
  )

  const ridesWithMemories = rides.filter(r => memoriesByRide[r.id]?.length > 0)
  const ridesWithoutMemories = rides.filter(r => !memoriesByRide[r.id]?.length)

  return (
    <DashboardLayout>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h1><FiCamera className="text-accent" /> Ride Memories</h1>
          <p>Photos organized by ride — your road trips, your stories</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(!showUpload)}>
          <FiUpload className="me-1" /> Upload Memory
        </button>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* Upload Panel */}
      {showUpload && (
        <div className="upload-panel mb-4 animate-fadeIn">
          <h5 className="mb-3">📷 Upload a Memory</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Select Photo</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="form-control"
                onChange={(e) => setUploadData({ ...uploadData, image: e.target.files[0] })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Link to Ride (optional)</label>
              <select
                className="form-control"
                value={uploadRideId}
                onChange={(e) => setUploadRideId(e.target.value)}
              >
                <option value="">— No specific ride —</option>
                {rides.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <input
                type="text"
                className="form-control"
                placeholder="Add a caption..."
                value={uploadData.caption}
                onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
              />
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !uploadData.image}>
                {uploading ? <><span className="spinner-border spinner-border-sm me-2" />Uploading...</> : 'Upload Photo'}
              </button>
              <button className="btn btn-dark" onClick={() => setShowUpload(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-accent" /></div>
      ) : (
        <>
          {/* Rides with Memories — Album View */}
          {ridesWithMemories.map(ride => (
            <div key={ride.id} className="ride-album mb-4">
              <div className="album-header" onClick={() => toggleRide(ride.id)}>
                <div className="album-info">
                  <span className="album-icon">🏍️</span>
                  <div>
                    <h4 className="album-title">{ride.title}</h4>
                    <span className="album-meta">
                      {ride.startLocation || ride.start_location} → {ride.endLocation || ride.end_location}
                      &nbsp;·&nbsp; {memoriesByRide[ride.id].length} photo{memoriesByRide[ride.id].length !== 1 ? 's' : ''}
                      &nbsp;·&nbsp; {ride.date}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-dark btn-sm py-1" 
                    onClick={(e) => { e.stopPropagation(); handleDownloadAll(memoriesByRide[ride.id], ride.title); }}
                  >
                    <FiDownload size={13} className="me-1" /> Download All
                  </button>
                  <button className="album-toggle-btn">
                    {expandedRides[ride.id] ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>
              {expandedRides[ride.id] && (
                <div className="album-body animate-fadeIn">
                  <MemoryGrid memories={memoriesByRide[ride.id]} rideId={ride.id} />
                </div>
              )}
            </div>
          ))}

          {/* Global / unlinked memories */}
          {globalMemories.length > 0 && (
            <div className="ride-album mb-4">
              <div className="album-header" onClick={() => toggleRide('global')}>
                <div className="album-info">
                  <span className="album-icon">📸</span>
                  <div>
                    <h4 className="album-title">Other Memories</h4>
                    <span className="album-meta">{globalMemories.length} photo{globalMemories.length !== 1 ? 's' : ''} not linked to a ride</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-dark btn-sm py-1" 
                    onClick={(e) => { e.stopPropagation(); handleDownloadAll(globalMemories, 'Other_Memories'); }}
                  >
                    <FiDownload size={13} className="me-1" /> Download All
                  </button>
                  <button className="album-toggle-btn">
                    {expandedRides['global'] ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>
              {expandedRides['global'] && (
                <div className="album-body animate-fadeIn">
                  <MemoryGrid memories={globalMemories} rideId={null} />
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {ridesWithMemories.length === 0 && globalMemories.length === 0 && (
            <div className="text-center py-5">
              <FiCamera size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No memories yet</h5>
              <p className="text-muted small">Upload your first ride photo to start your album!</p>
              <button className="btn btn-primary mt-2" onClick={() => setShowUpload(true)}>
                <FiUpload className="me-1" /> Upload Now
              </button>
            </div>
          )}

          {/* Rides without memories */}
          {ridesWithoutMemories.length > 0 && ridesWithMemories.length > 0 && (
            <div className="empty-rides-hint mt-3">
              <p className="text-muted small">
                💡 {ridesWithoutMemories.length} more ride{ridesWithoutMemories.length !== 1 ? 's have' : ' has'} no photos yet —
                upload and link them when you're ready!
              </p>
            </div>
          )}
        </>
      )}

      <style>{`
        .upload-panel {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: 1.5rem;
        }
        .ride-album {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .album-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .album-header:hover { background: rgba(255,107,0,0.05); }
        .album-info { display: flex; align-items: center; gap: 12px; }
        .album-icon { font-size: 1.5rem; }
        .album-title { font-size: 1rem; font-weight: 700; margin: 0; }
        .album-meta { font-size: 0.78rem; color: var(--text-muted); }
        .album-toggle-btn {
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; font-size: 1.1rem;
        }
        .album-body { padding: 0 1.25rem 1.25rem; }
        .memory-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;
          padding-top: 0.75rem;
        }
        .memory-card {
          background: var(--bg-surface); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); overflow: hidden;
          transition: all var(--transition-normal);
        }
        .memory-card:hover { border-color: var(--primary); transform: translateY(-2px); }
        .memory-img {
          height: 180px; background-size: cover; background-position: center;
          position: relative;
        }
        .memory-img-placeholder {
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-input);
        }
        .memory-actions {
          position: absolute; top: 8px; right: 8px;
          display: flex; gap: 6px;
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .memory-card:hover .memory-actions { opacity: 1; }
        .memory-action-btn {
          background: rgba(0,0,0,0.6); border: none; color: #fff;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all var(--transition-fast);
        }
        .memory-action-btn:hover { background: var(--primary); }
        .memory-action-btn.delete:hover { background: #EF4444; }
        @media (max-width: 768px) {
          .memory-actions { opacity: 1; }
        }
        .memory-info { padding: 0.75rem 1rem; }
        .memory-caption { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem; }
        .memory-meta {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.75rem; color: var(--text-muted);
        }
        .like-btn {
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; display: flex; align-items: center; gap: 4px;
          padding: 0; font-size: 0.75rem;
          transition: color var(--transition-fast);
        }
        .like-btn:hover { color: #EF4444; }
        .memory-author { font-size: 0.72rem; color: var(--text-secondary); }
        .empty-rides-hint {
          border-top: 1px solid var(--border-color); padding-top: 1rem;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default Memories
