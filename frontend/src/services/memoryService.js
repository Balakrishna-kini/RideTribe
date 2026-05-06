import api from './api'

const memoryService = {
  async getMemories(rideId = null) {
    const url = rideId ? `/memories/?ride=${rideId}` : '/memories/'
    const res = await api.get(url)
    return Array.isArray(res.data) ? res.data : res.data.results || []
  },

  async uploadMemory(formData) {
    const res = await api.post('/memories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async deleteMemory(id) {
    await api.delete(`/memories/${id}/`)
  },

  async likeMemory(id) {
    const res = await api.post(`/memories/${id}/like/`)
    return res.data
  },
}

export default memoryService
