import React from 'react'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiHome } from 'react-icons/fi'
import Logo from '../components/Logo'

const NotFound = () => {
  return (
    <div className="notfound-wrapper">
      <div className="notfound-card animate-fadeIn">
        <Logo size="large" />
        <div className="notfound-icon mt-4 mb-3">
          <FiAlertTriangle size={64} className="text-accent" />
        </div>
        <h1 className="mb-2">404 - Page Not Found</h1>
        <p className="text-muted mb-4">The road you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn btn-primary px-4 py-2">
          <FiHome size={18} className="me-2" /> Back to Dashboard
        </Link>
      </div>

      <style>{`
        .notfound-wrapper {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }
        .notfound-card {
          background: #111;
          border: 1px solid #333;
          border-radius: 20px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        h1 { font-size: 2rem; font-weight: 800; color: #fff; }
        p { font-size: 1rem; }
      `}</style>
    </div>
  )
}

export default NotFound
