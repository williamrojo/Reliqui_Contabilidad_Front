import { defineStore } from 'pinia'
import { publicAPI } from 'src/boot/axios'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const tenantId = ref(null)
  const profile = ref(null)

  const login = async (username, password, tenant) => {
    try {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const res = await publicAPI({
        method: 'POST',
        url: '/api/auth/login',
        data: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      token.value = res.data.access_token
      tenantId.value = tenant
      profile.value = { username }
      sessionStorage.setItem('isAuth', true)
    } catch (error) {
      if (error.response) throw error.response.data
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    try {
      await publicAPI.post('/api/auth/logout')
    } catch (error) {
      console.log(error)
    } finally {
      resetStore()
      sessionStorage.removeItem('isAuth')
    }
  }

  const refreshToken = async () => {
    try {
      const res = await publicAPI.get('/api/auth/refresh')
      token.value = res.data.access_token
    } catch (error) {
      console.log('Error refrescando sesión:', error)
      resetStore()
      sessionStorage.removeItem('isAuth')
      throw error
    }
  }

  const resetStore = () => {
    token.value = null
    tenantId.value = null
    profile.value = null
  }

  return {
    token,
    tenantId,
    profile,
    login,
    logout,
    refreshToken,
  }
})
