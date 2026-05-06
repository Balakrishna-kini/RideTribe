import React, { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="page-wrapper">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
