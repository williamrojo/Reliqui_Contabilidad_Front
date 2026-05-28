import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import routes from './routes'

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // ==========================================
  // NAVIGATION GUARD (CON SILENT REFRESH)
  // ==========================================
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const isAuthSession = sessionStorage.getItem('isAuth') === 'true'

    // CASO 1: Ruta Privada (Ej. El Tablero)
    if (requiresAuth) {
      if (!isAuthSession) {
        // No hay bandera, lo pateamos al login
        next('/acceso')
      } else {
        if (!authStore.token) {
          try {
            // Intentamos recuperar el token silenciosamente usando la Cookie
            await authStore.refreshToken()
            next() // Éxito: el backend nos dio un token nuevo. Lo dejamos pasar.
          } catch (error) {
            // Fracaso: la Cookie expiró o no existe. Lo mandamos al login.
            console.warn('Silent refresh falló:', error)
            next('/acceso')
          }
        } else {
          // Todo normal, navegando sin recargar la página
          next()
        }
      }
    }
    // CASO 2: Intentando ir al Login estando autenticado
    else if (to.path === '/acceso' && isAuthSession) {
      if (!authStore.token) {
        // Recargó la página estando en /acceso
        try {
          await authStore.refreshToken()
          next('/') // Recuperó sesión, lo mandamos al Tablero
        } catch (error) {
          console.warn('No se pudo recuperar la sesión anterior:', error)
          next() // No pudo recuperar sesión, lo dejamos quedarse en el Login
        }
      } else {
        next('/') // Ya tiene sesión activa, va directo al Tablero
      }
    }
    // CASO 3: Rutas públicas que no son el login (si las tienes en un futuro)
    else {
      next()
    }
  })

  return Router
})
