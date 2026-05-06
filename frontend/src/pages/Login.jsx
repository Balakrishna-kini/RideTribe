import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi'
import Logo from '../components/Logo'
import authService from '../services/authService'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data?.error) {
        setError(data.error)
      } else if (data) {
        const messages = Object.values(data).flat().join(' ')
        setError(messages || 'Invalid credentials. Please try again.')
      } else {
        setError('Invalid credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-glow"></div>
      </div>
      <div className="auth-container">
        <div className="auth-card animate-fadeInUp">
          <div className="auth-header">
            <Link to="/" className="auth-logo-link">
              <Logo size="large" />
            </Link>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to your RiderTribe account</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              {loading ? 'Logging in...' : 'Log In'}
              {!loading && <FiArrowRight className="ms-2" />}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
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
        .auth-bg-effects {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .auth-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          background: rgba(255,107,0,0.08);
          border-radius: 50%;
          filter: blur(120px);
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
        }
        .auth-container {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 2;
        }
        .auth-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-logo-link {
          display: inline-flex;
          text-decoration: none;
          margin-bottom: 1.5rem;
        }
        .auth-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
        }
        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .input-icon-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          z-index: 2;
        }
        .input-icon-wrapper .form-control {
          padding-left: 2.5rem !important;
          padding-right: 2.5rem !important;
        }
        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          z-index: 2;
        }
        .password-toggle:hover { color: var(--primary); }
        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }
        .auth-footer p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 0;
        }
        .auth-footer a {
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}

export default Login
