import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiPhone } from 'react-icons/fi'
import Logo from '../components/Logo'
import authService from '../services/authService'

const Signup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.signup({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        // Parse field-level errors from DRF
        const messages = Object.values(data).flat().join(' ')
        setError(messages || 'Registration failed. Please try again.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const update = (field, value) => setFormData({ ...formData, [field]: value })

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-glow"></div>
      </div>
      <div className="auth-container" style={{ maxWidth: 480 }}>
        <div className="auth-card animate-fadeInUp">
          <div className="auth-header">
            <Link to="/" className="auth-logo-link">
              <Logo size="large" />
            </Link>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join the RiderTribe community</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label">First Name</label>
                <div className="input-icon-wrapper">
                  <FiUser className="input-icon" />
                  <input type="text" className="form-control" placeholder="John" value={formData.firstName} onChange={(e) => update('firstName', e.target.value)} required />
                </div>
              </div>
              <div className="col-6">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" placeholder="Rider" value={formData.lastName} onChange={(e) => update('lastName', e.target.value)} required />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrapper">
                <FiMail className="input-icon" />
                <input type="email" className="form-control" placeholder="you@example.com" value={formData.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <div className="input-icon-wrapper">
                <FiPhone className="input-icon" />
                <input type="tel" className="form-control" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="form-label">Password</label>
                <div className="input-icon-wrapper">
                  <FiLock className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Min 8 chars" value={formData.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
                </div>
              </div>
              <div className="col-6">
                <label className="form-label">Confirm</label>
                <div className="input-icon-wrapper">
                  <FiLock className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Re-enter" value={formData.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <FiArrowRight className="ms-2" />}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem;
        }
        .auth-bg-effects { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .auth-glow { position: absolute; width: 500px; height: 500px; background: rgba(255,107,0,0.08); border-radius: 50%; filter: blur(120px); top: -100px; left: 50%; transform: translateX(-50%); }
        .auth-container { width: 100%; position: relative; z-index: 2; }
        .auth-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2.5rem; }
        .auth-header { text-align: center; margin-bottom: 2rem; }
        .auth-logo-link { display: inline-flex; text-decoration: none; margin-bottom: 1.5rem; }
        .auth-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem; }
        .auth-subtitle { color: var(--text-secondary); font-size: 0.9rem; }
        .input-icon-wrapper { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); z-index: 2; }
        .input-icon-wrapper .form-control { padding-left: 2.5rem !important; }
        .password-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; z-index: 2; }
        .password-toggle:hover { color: var(--primary); }
        .auth-footer { text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
        .auth-footer p { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }
        .auth-footer a { color: var(--primary); font-weight: 600; }
      `}</style>
    </div>
  )
}

export default Signup
