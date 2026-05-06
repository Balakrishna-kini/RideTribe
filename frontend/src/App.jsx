import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import DiscoverRides from './pages/DiscoverRides'
import CreateRide from './pages/CreateRide'
import RideDetails from './pages/RideDetails'
import LiveTracking from './pages/LiveTracking'
import Navigation from './pages/Navigation'
import Profile from './pages/Profile'
import Memories from './pages/Memories'
import FuelFinder from './pages/FuelFinder'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Help from './pages/Help'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><DiscoverRides /></ProtectedRoute>} />
      <Route path="/create-ride" element={<ProtectedRoute><CreateRide /></ProtectedRoute>} />
      <Route path="/ride/:id" element={<ProtectedRoute><RideDetails /></ProtectedRoute>} />
      <Route path="/live-tracking" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
      <Route path="/navigation/direct/:stateKey" element={<ProtectedRoute><Navigation /></ProtectedRoute>} />
      <Route path="/navigation/:rideId" element={<ProtectedRoute><Navigation /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />
      <Route path="/fuel-finder" element={<ProtectedRoute><FuelFinder /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      
      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
