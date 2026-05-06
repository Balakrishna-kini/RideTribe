import api from './api'

const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications/')
    return Array.isArray(res.data) ? res.data : res.data.results || []
  },

  async markRead(id) {
    const res = await api.patch(`/notifications/${id}/read/`)
    return res.data
  },

  async markAllRead() {
    const res = await api.post('/notifications/read-all/')
    return res.data
  },
}

export default notificationService
