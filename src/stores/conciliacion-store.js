import { defineStore } from 'pinia'
import { secureAPI } from 'src/boot/axios'
import { ref } from 'vue'

export const useConciliacionStore = defineStore('conciliacion', () => {
  // Estado
  const resumen = ref(null)
  const isProcessing = ref(false)
  const errorMsg = ref(null)

  // Acciones
  const procesarCruces = async (datosFormulario) => {
    isProcessing.value = true
    errorMsg.value = null
    resumen.value = null

    try {
      // 1. Preparamos el FormData
      const formData = new FormData()
      formData.append('tenant_id', datosFormulario.tenantId)
      formData.append('header_row', datosFormulario.headerRow)
      formData.append('debug_json', datosFormulario.debugJson)

      formData.append('archivo_vouchers', datosFormulario.archivoVouchers)

      if (datosFormulario.archivoBbva) {
        formData.append('archivo_bbva', datosFormulario.archivoBbva)
      }
      if (datosFormulario.archivoAfirme) {
        formData.append('archivo_afirme', datosFormulario.archivoAfirme)
      }
      if (datosFormulario.archivoBanbajio) {
        formData.append('archivo_banbajio', datosFormulario.archivoBanbajio)
      }

      // 2. Enviamos la petición
      // Importante: Cuando Axios recibe un FormData, automáticamente ajusta
      // el Content-Type a 'multipart/form-data'. No necesitas agregarlo a mano.
      // secureAPI ya inyecta el token Bearer.
      // Le pedimos a Axios que la respuesta venga como blob (archivo binario).
      const res = await secureAPI.post('/api/conciliacion/cruzar', formData, {
        responseType: 'blob',
      })

      // 3. Procesar respuesta según el modo (Debug vs Producción)
      if (datosFormulario.debugJson) {
        // En modo debug, el backend envía un JSON, pero le dijimos a Axios
        // que esperara un blob. Tenemos que convertir el blob de vuelta a texto/JSON.
        const textoJSON = await res.data.text()
        const data = JSON.parse(textoJSON)
        resumen.value = data.resumen
      } else {
        // Modo producción: Leer headers y descargar archivo
        const resumenHeader = res.headers['x-resumen-conciliacion']
        if (resumenHeader) {
          resumen.value = JSON.parse(resumenHeader)
        }

        descargarExcel(res.data, 'Reporte_Pendientes.xlsx')
      }

      return true
    } catch (error) {
      console.error('Error en conciliación:', error)

      // Si el backend envía un 400 con un detalle en formato JSON (pero envuelto en blob)
      if (
        error.response &&
        error.response.data instanceof Blob &&
        error.response.data.type === 'application/json'
      ) {
        try {
          const errorText = await error.response.data.text()
          const errorData = JSON.parse(errorText)
          errorMsg.value = errorData.detail || 'Error al procesar los archivos.'
        } catch (e) {
          errorMsg.value = 'Error al leer el detalle del problema desde el servidor: ' + e.message
        }
      } else if (error.response && error.response.data && error.response.data.detail) {
        errorMsg.value = error.response.data.detail
      } else {
        errorMsg.value = error.message || 'Error de conexión con el servidor.'
      }

      throw new Error(errorMsg.value)
    } finally {
      isProcessing.value = false
    }
  }

  // Función auxiliar privada (no exportada)
  const descargarExcel = (blobData, nombreArchivo) => {
    const url = window.URL.createObjectURL(blobData)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const resetState = () => {
    resumen.value = null
    errorMsg.value = null
  }

  return {
    resumen,
    isProcessing,
    errorMsg,
    procesarCruces,
    resetState,
  }
})
