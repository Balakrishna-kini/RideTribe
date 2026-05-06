import api from './api'

const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('token', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  },

  async signup(data) {
    const res = await api.post('/auth/register/', data)
    localStorage.setItem('token', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
  },

  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  async getProfile() {
    const res = await api.get('/auth/profile/')
    const user = res.data
    localStorage.setItem('user', JSON.stringify(user))
    return user
  },

  async updateProfile(data) {
    const res = await api.patch('/auth/profile/', data)
    localStorage.setItem('user', JSON.stringify(res.data))
    return res.data
  },

  async getVehicles() {
    const res = await api.get('/auth/vehicles/')
    return res.data
  },

  async addVehicle(data) {
    const res = await api.post('/auth/vehicles/', data)
    return res.data
  },

  async deleteVehicle(id) {
    await api.delete(`/auth/vehicles/${id}/`)
  },

  async refreshToken() {
    const refresh = localStorage.getItem('refresh')
    if (!refresh) throw new Error('No refresh token')
    const res = await api.post('/auth/token/refresh/', { refresh })
    localStorage.setItem('token', res.data.access)
    if (res.data.refresh) {
      localStorage.setItem('refresh', res.data.refresh)
    }
    return res.data
  }
}

export default authService
