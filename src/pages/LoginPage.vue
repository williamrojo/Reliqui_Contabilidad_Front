<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const isPasswordVisible = ref(false)

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const handleLogin = async () => {
  loading.value = true

  try {
    await authStore.login(username.value, password.value, 'DEFAULT')

    $q.notify({
      type: 'positive',
      message: 'Bienvenido al sistema',
      icon: 'check_circle',
    })

    router.push('/')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.detail || error.message || 'Error al iniciar sesión',
      icon: 'warning',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-page class="flex flex-center">
    <q-card class="login-card q-pa-md">
      <q-card-section class="text-center">
        <q-img
          src="~assets/ReliquiLogo.png"
          style="width: 140px; height: auto"
          class="q-mx-auto q-mb-sm"
          fit="contain"
        />
        <div class="text-h5 text-weight-bold q-mt-sm text-grey-9">Reliqui Systems</div>
        <div class="text-subtitle2 text-grey-6">Motor de Conciliación Contable</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            outlined
            v-model="username"
            label="Usuario"
            color="secondary"
            lazy-rules
            :rules="[(val) => !!val || 'El usuario es obligatorio']"
          >
            <template v-slot:prepend>
              <q-icon name="person" color="grey-7" />
            </template>
          </q-input>

          <q-input
            outlined
            :type="isPasswordVisible ? 'text' : 'password'"
            v-model="password"
            label="Contraseña"
            color="secondary"
            lazy-rules
            :rules="[(val) => !!val || 'La contraseña es obligatoria']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="grey-7" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isPasswordVisible ? 'visibility' : 'visibility_off'"
                class="cursor-pointer text-grey-7"
                @click="togglePasswordVisibility"
              />
            </template>
          </q-input>

          <q-btn
            unelevated
            size="lg"
            color="primary"
            class="full-width q-mt-md font-weight-bold btn-login"
            type="submit"
            :loading="loading"
            label="INGRESAR"
            icon-right="login"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px; /* Bordes un poco más suaves */
  background-color: #ffffff;
  /* Sombra difuminada, moderna y mucho menos agresiva para la vista */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.03); /* Un borde casi invisible para dar profundidad */
}

/* Animación sutil al pasar el mouse por el botón principal */
.btn-login {
  border-radius: 8px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
