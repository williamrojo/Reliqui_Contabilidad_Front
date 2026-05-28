import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useAuthStore } from 'src/stores/auth-store'

const publicAPI = axios.create({
  baseURL: process.env.API_URL,
  withCredentials: true,
})

const secureAPI = axios.create({
  baseURL: process.env.API_URL,
  withCredentials: true,
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$publicAPI = publicAPI
  app.config.globalProperties.$secureAPI = secureAPI

  secureAPI.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore()
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )
})

export { publicAPI, secureAPI }
