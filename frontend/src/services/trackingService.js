import api from './api'

const trackingService = {
  async getRideLocations(rideId) {
    const res = await api.get(`/tracking/${rideId}/`)
    return Array.isArray(res.data) ? res.data : res.data.results || []
  },

  async updateLocation(rideId, data) {
    const res = await api.post(`/tracking/${rideId}/update/`, data)
    return res.data
  },
}

export default trackingService
