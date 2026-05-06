import React, { useState } from 'react'
import { FiHelpCircle, FiChevronDown, FiChevronUp, FiMail, FiMessageCircle } from 'react-icons/fi'
import DashboardLayout from '../components/DashboardLayout'
import Logo from '../components/Logo'

const faqs = [
  { q: 'Create Ride', a: 'Go to the "Create Ride" page from the sidebar. Fill in the ride details including title, start/end locations, date, and maximum members. Your ride will be published.' },
  { q: 'Start Ride', a: 'As the organizer, go to the "Live Tracking" page, select your upcoming ride, and click "Start Ride Now" to begin tracking.' },
  { q: 'Live Tracking', a: 'When a ride is active, all members can share their location in real-time. The map shows each rider\'s position with color-coded markers. A lag alert is triggered if someone falls behind.' },
  { q: 'Fuel Finder', a: 'Use the "Fuel Finder" from the sidebar to scan for gas stations near your current location. You can also find a quick-access fuel button directly on the Live Tracking map.' },
  { q: 'Ride Completion', a: 'The app automatically detects when you reach the destination. As an organizer, you can also manually end the ride from the Live Tracking page to mark it as completed.' },
]

const Help = () => {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1><FiHelpCircle className="text-accent" /> Help Center</h1>
        <p>Find answers to frequently asked questions</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="faq-section">
            <h3 className="mb-3">Frequently Asked Questions</h3>
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className={`faq-item ${openIdx === i ? 'open' : ''}`}>
                  <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                    <span>{faq.q}</span>
                    {openIdx === i ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </button>
                  {openIdx === i && (
                    <div className="faq-answer animate-fadeIn">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="help-card mb-4">
            <Logo size="medium" />
            <div className="mt-3 text-muted small lh-lg">
              <strong>About RiderTribe:</strong> The ultimate community for motorcycle enthusiasts. Connect with riders, track journeys in real-time, and discover new adventures safely and seamlessly.
            </div>
          </div>

          <div className="help-card mb-4">
            <h4>Contact Support</h4>
            <p className="text-muted small">Our support team is here to assist you with any questions.</p>
            <a href="mailto:support@ridertribe.com" className="btn btn-primary w-100 mb-2">
              <FiMail className="me-2" /> Email Support
            </a>
            <button className="btn btn-dark w-100">
              <FiMessageCircle className="me-2" /> Live Chat
            </button>
          </div>

          <div className="help-card">
            <h4>Quick Links</h4>
            <ul className="help-links">
              <li><a href="#">Getting Started Guide</a></li>
              <li><a href="#">Safety Guidelines</a></li>
              <li><a href="#">Community Rules</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .faq-list { display: flex; flex-direction: column; gap: 4px; }
        .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .faq-item.open { border-color: var(--primary); }
        .faq-question {
          width: 100%;
          background: none;
          border: none;
          color: var(--text-primary);
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }
        .faq-question:hover { color: var(--primary); }
        .faq-answer {
          padding: 0 1.25rem 1rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .faq-answer p { margin: 0; }
        .help-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }
        .help-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .help-links li {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .help-links li:last-child { border-bottom: none; }
        .help-links a {
          color: var(--text-secondary);
          font-size: 0.9rem;
          transition: color var(--transition-fast);
        }
        .help-links a:hover { color: var(--primary); }
      `}</style>
    </DashboardLayout>
  )
}

export default Help
