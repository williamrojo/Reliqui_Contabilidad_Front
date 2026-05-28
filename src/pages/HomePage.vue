<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth-store'
import { useConciliacionStore } from 'src/stores/conciliacion-store'

// Importar Componentes
import DonutChartCard from 'components/DonutChartCard.vue'
import SucursalesTableCard from 'components/SucursalesTableCard.vue'
import AreaChartCard from 'components/AreaChartCard.vue'

const $q = useQuasar()
const authStore = useAuthStore()
const conciliacionStore = useConciliacionStore()

const archivoVouchers = ref(null)
const archivoBbva = ref(null)
const archivoAfirme = ref(null)
const archivoBanbajio = ref(null)
const archivosModificados = ref(true)

const selectedSucursal = ref(null)
const showInstrucciones = ref(false)
const slide = ref('intro')

const rawMontoPendiente = computed(() => {
  if (!conciliacionStore.resumen?.sucursales) return '0'
  const suma = conciliacionStore.resumen.sucursales.reduce((acc, suc) => {
    return acc + (parseFloat(suc.monto.replace(/[$,]/g, '')) || 0)
  }, 0)
  return suma.toString()
})

onMounted(() => {
  conciliacionStore.resetState()
  if (!sessionStorage.getItem('reliqui_intro_seen')) showInstrucciones.value = true
})

const abrirInstrucciones = () => {
  slide.value = 'intro'
  showInstrucciones.value = true
}
const avanzarCarrusel = () => {
  if (slide.value === 'intro') slide.value = 'formatos'
  else if (slide.value === 'formatos') slide.value = 'privacidad'
  else {
    sessionStorage.setItem('reliqui_intro_seen', 'true')
    showInstrucciones.value = false
  }
}

watch([archivoVouchers, archivoBbva, archivoAfirme, archivoBanbajio], () => {
  archivosModificados.value = true
})

const onFileRejected = (rejectedEntries) => {
  $q.notify({
    type: 'negative',
    message: `Archivo inválido: ${rejectedEntries[0].file.name}. Solo .xlsx, .xls`,
    icon: 'warning',
  })
}

const ejecutarConciliacion = async () => {
  if (!archivoVouchers.value) {
    $q.notify({
      type: 'warning',
      message: 'El archivo de Vouchers Empresa es obligatorio',
      icon: 'error',
    })
    return
  }
  try {
    await conciliacionStore.procesarCruces({
      tenantId: authStore.tenantId || 'DEFAULT',
      headerRow: 5,
      debugJson: false,
      archivoVouchers: archivoVouchers.value,
      archivoBbva: archivoBbva.value,
      archivoAfirme: archivoAfirme.value,
      archivoBanbajio: archivoBanbajio.value,
    })
    archivosModificados.value = false
    selectedSucursal.value = null
    $q.notify({ type: 'positive', message: 'Reporte generado con éxito', icon: 'check_circle' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Error al procesar', icon: 'error' })
  }
}

const handleSelectSucursal = (sucursal) => {
  selectedSucursal.value = sucursal
}
</script>

<template>
  <q-page class="q-pa-md q-pa-lg-lg full-width-page">
    <q-dialog v-model="showInstrucciones" persistent>
      <q-card style="width: 100%; max-width: 450px; border-radius: 16px; overflow: hidden">
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          animated
          control-color="primary"
          padding
          height="320px"
          class="bg-white"
        >
          <q-carousel-slide name="intro" class="column no-wrap flex-center text-center">
            <q-icon name="auto_awesome" color="primary" size="3rem" class="q-mb-md" />
            <div class="text-h6 text-primary text-weight-bold q-mb-sm">
              Bienvenido a Reliqui Systems
            </div>
            <div class="text-body2 text-grey-8">
              1. Sube tu archivo maestro de <b>Vouchers</b>.<br />2. Sube los
              <b>Estados de Cuenta</b>.<br />3. Haz clic en <b>Ejecutar Conciliación</b>.
            </div>
          </q-carousel-slide>
          <q-carousel-slide name="formatos" class="column no-wrap flex-center text-center">
            <q-icon name="warning_amber" color="warning" size="3rem" class="q-mb-md" />
            <div class="text-h6 text-primary text-weight-bold q-mb-sm">
              Aviso sobre los Formatos
            </div>
            <div class="text-body2 text-grey-8">
              Si modificas tus archivos o el banco cambia su estructura, infórmanos de inmediato.
            </div>
          </q-carousel-slide>
          <q-carousel-slide name="privacidad" class="column no-wrap flex-center text-center">
            <q-icon name="security" color="positive" size="3rem" class="q-mb-md" />
            <div class="text-h6 text-primary text-weight-bold q-mb-sm">Privacidad y Seguridad</div>
            <div class="text-body2 text-grey-8">
              Tus datos están seguros.<br /><br /><b>NO guardamos ni retenemos</b> la información.
            </div>
          </q-carousel-slide>
        </q-carousel>
        <q-card-actions align="center" class="bg-grey-1 q-pa-md">
          <q-btn
            unelevated
            :label="slide === 'privacidad' ? 'Entendido, comenzar' : 'Siguiente'"
            color="primary"
            @click="avanzarCarrusel"
            class="full-width text-weight-bold glass-btn-solid"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="row q-col-gutter-lg items-stretch">
      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="glass-card full-width column sync-height overflow-hidden">
          <q-card-section class="glass-header row items-center justify-between">
            <div class="text-h6 text-weight-bolder text-white text-truncate">
              Archivos a Conciliar
            </div>
            <q-btn
              flat
              round
              color="grey-4"
              size="sm"
              icon="help_outline"
              @click="abrirInstrucciones"
            />
          </q-card-section>

          <q-card-section
            class="col scroll q-pa-md column no-wrap"
            style="max-width: 100%; overflow-x: hidden"
          >
            <div
              class="text-caption text-weight-bold text-grey-7 text-uppercase letter-spacing q-mb-xs"
            >
              Archivo Maestro
            </div>
            <q-file
              v-model="archivoVouchers"
              dense
              label="Vouchers *"
              outlined
              clearable
              accept=".xlsx, .xls, .xlsm"
              @rejected="onFileRejected"
              color="primary"
              class="glass-input full-width q-mb-sm"
              style="max-width: 100%"
              input-class="text-truncate"
            >
              <template v-slot:prepend
                ><q-icon name="receipt_long" color="primary" size="sm"
              /></template>
            </q-file>

            <q-separator color="white" class="opacity-50 q-my-sm" />

            <div
              class="text-caption text-weight-bold text-grey-7 text-uppercase letter-spacing q-mb-xs"
            >
              Estados de Cuenta
            </div>
            <q-file
              v-model="archivoBbva"
              dense
              label="BBVA"
              outlined
              clearable
              accept=".xlsx, .xls, .xlsm"
              @rejected="onFileRejected"
              color="secondary"
              class="glass-input full-width q-mb-sm"
              style="max-width: 100%"
              input-class="text-truncate"
            >
              <template v-slot:prepend
                ><q-icon name="account_balance" color="grey-6" size="sm"
              /></template>
            </q-file>
            <q-file
              v-model="archivoAfirme"
              dense
              label="Afirme"
              outlined
              clearable
              accept=".xlsx, .xls, .xlsm"
              @rejected="onFileRejected"
              color="secondary"
              class="glass-input full-width q-mb-sm"
              style="max-width: 100%"
              input-class="text-truncate"
            >
              <template v-slot:prepend
                ><q-icon name="account_balance" color="grey-6" size="sm"
              /></template>
            </q-file>
            <q-file
              v-model="archivoBanbajio"
              dense
              label="BanBajío"
              outlined
              clearable
              accept=".xlsx, .xls, .xlsm"
              @rejected="onFileRejected"
              color="secondary"
              class="glass-input full-width"
              style="max-width: 100%"
              input-class="text-truncate"
            >
              <template v-slot:prepend
                ><q-icon name="account_balance" color="grey-6" size="sm"
              /></template>
            </q-file>
          </q-card-section>

          <q-card-actions class="q-pa-md glass-footer">
            <q-btn
              color="primary"
              label="Ejecutar Motor"
              size="md"
              unelevated
              class="full-width glass-btn-solid shadow-3"
              :disable="!archivosModificados || conciliacionStore.isProcessing"
              :loading="conciliacionStore.isProcessing"
              @click="ejecutarConciliacion"
            >
              <template v-slot:loading> <q-spinner-cube class="on-left" /> Procesando... </template>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>

      <template v-if="conciliacionStore.resumen">
        <div class="col-12 col-md-6 col-lg-3">
          <DonutChartCard
            class="sync-height"
            :resumen="conciliacionStore.resumen"
            :montoPendiente="rawMontoPendiente"
          />
        </div>

        <div class="col-12 col-md-12 col-lg-6">
          <SucursalesTableCard
            class="sync-height"
            :sucursales="conciliacionStore.resumen.sucursales"
            :selectedId="selectedSucursal?.id"
            @select-sucursal="handleSelectSucursal"
          />
        </div>
      </template>

      <template v-else>
        <div class="col-12 col-md-6 col-lg-9">
          <q-card
            class="glass-card full-width sync-height border-dashed column items-center justify-center"
            style="background: rgba(255, 255, 255, 0.3)"
          >
            <div class="q-pa-xl text-center opacity-60">
              <q-icon name="analytics" size="6rem" color="grey-6" class="q-mb-md" />
              <div class="text-h5 text-grey-8 text-weight-bold">Esperando Datos</div>
            </div>
          </q-card>
        </div>
      </template>
    </div>

    <div class="row" v-if="conciliacionStore.resumen">
      <div class="col-12">
        <AreaChartCard :sucursal="selectedSucursal" />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.full-width-page {
  width: 100%;
}
.text-dark-blue {
  color: #0f172a;
}
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* REGLA MAESTRA DE ALTURA */
@media (min-width: 1024px) {
  .sync-height {
    height: 480px; /* Suficiente para acomodar los 4 inputs sin aplastar */
  }
}
@media (max-width: 1023px) {
  .sync-height {
    height: auto;
    min-height: auto;
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 40px rgba(31, 38, 135, 0.05);
  border-radius: 16px;
}
.glass-header {
  background-color: #0f172a !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 60px;
}
.glass-footer {
  background: rgba(255, 255, 255, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
}
.glass-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}
.glass-input :deep(.q-field__control:hover) {
  background: rgba(255, 255, 255, 0.8) !important;
}
.glass-btn-solid {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border-radius: 10px;
  font-weight: 600;
  color: white;
}
.border-dashed {
  border: 1px dashed rgba(15, 23, 42, 0.15);
  box-shadow: none !important;
}
.letter-spacing {
  letter-spacing: 1px;
}
.opacity-60 {
  opacity: 0.6;
}
.opacity-50 {
  opacity: 0.5;
}
</style>
