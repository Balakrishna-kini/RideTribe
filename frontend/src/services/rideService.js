import api from './api'

const rideService = {
  async getRides(filters = {}) {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    const res = await api.get(`/rides/?${params.toString()}`)
    return Array.isArray(res.data) ? res.data : res.data.results || []
  },

  async getRide(id) {
    const res = await api.get(`/rides/${id}/`)
    return res.data
  },

  async createRide(data) {
    const res = await api.post('/rides/', data)
    return res.data
  },

  async updateRide(id, data) {
    const res = await api.put(`/rides/${id}/`, data)
    return res.data
  },

  async deleteRide(id) {
    await api.delete(`/rides/${id}/`)
  },

  async joinRide(id) {
    const res = await api.post(`/rides/${id}/join/`)
    return res.data
  },

  async leaveRide(id) {
    const res = await api.post(`/rides/${id}/leave/`)
    return res.data
  },

  /**
   * Calculate road distance via Django backend.
   * Returns { distance_km, duration_min, distance_text, duration_text, source, route_coords }
   */
  async getDistance(origin, destination) {
    const params = new URLSearchParams({ origin, destination, t: Date.now() })
    const res = await api.get(`/rides/distance/?${params.toString()}`)
    return res.data
  },

  async getDashboardSummary() {
    const res = await api.get('/rides/dashboard/summary/')
    return res.data
  },
}

export default rideService
