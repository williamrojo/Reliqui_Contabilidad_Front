<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/acceso')
}
</script>

<template>
  <q-layout view="hHh lpR fFf" class="mesh-background">
    <q-header class="bg-dark-header shadow-bottom">
      <q-toolbar class="q-px-lg q-py-sm">
        <div class="row items-center no-wrap">
          <q-img
            src="~assets/ReliquiLogo.png"
            style="width: 40px; height: 40px"
            fit="contain"
            class="q-mr-sm"
          />
          <div class="text-h6 text-weight-bold gradient-text" style="letter-spacing: -0.5px">
            Reliqui Systems
          </div>
        </div>

        <q-space />

        <q-btn flat no-caps class="glass-btn text-white" @click="handleLogout">
          <q-icon name="logout" class="q-mr-sm" size="xs" />
          Cerrar Sesión
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* Fondo oscuro elegante para el header */
.bg-dark-header {
  background-color: #0f172a !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Gradiente de Verdes a Azules para que haga juego con tu logo */
.gradient-text {
  background: linear-gradient(90deg, #4ade80 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Botón transparente esmerilado */
.glass-btn {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}
.glass-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

/* Fondo Mesh fluido para que el Glassmorphism resalte */
.mesh-background {
  background-color: #f0f4f8;
  background-image:
    radial-gradient(at 10% 20%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
    radial-gradient(at 90% 80%, rgba(74, 222, 128, 0.15) 0px, transparent 50%),
    radial-gradient(at 80% 10%, rgba(14, 165, 233, 0.1) 0px, transparent 50%);
  background-attachment: fixed;
}
</style>
