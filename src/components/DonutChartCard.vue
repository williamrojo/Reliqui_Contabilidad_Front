<script setup>
import { ref, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  resumen: { type: Object, default: null },
  montoPendiente: { type: String, default: '0' },
})

const chartRef = ref(null)

const formatAbbreviation = (num) => {
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'k'
  return '$' + num.toFixed(0)
}

// Utilidad para dar formato de moneda completo en el panel inferior
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

const dibujarGrafica = (resumen, rawMontoTotal) => {
  if (!chartRef.value || !resumen) return
  d3.select(chartRef.value).selectAll('*').remove()

  const data = [
    { label: 'Exitosos', value: resumen.total_conciliados, color: '#34d399' },
    { label: 'Pendientes', value: resumen.total_pendientes, color: '#fbbf24' },
  ]

  const width = 220
  const height = 220
  const margin = 10
  const radius = Math.min(width, height) / 2 - margin

  const svg = d3
    .select(chartRef.value)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('max-width', '100%')
    .style('height', 'auto')
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null)
  const arc = d3
    .arc()
    .innerRadius(radius * 0.65)
    .outerRadius(radius)

  svg
    .selectAll('path')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('fill', (d) => d.data.color)
    .attr('stroke', 'rgba(255,255,255,0.5)')
    .style('stroke-width', '2px')
    .transition()
    .duration(1200)
    .attrTween('d', function (d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
      return function (t) {
        return arc(i(t))
      }
    })

  svg
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.1em')
    .style('font-size', '24px')
    .style('font-weight', '900')
    .style('fill', '#0f172a')
    .text(formatAbbreviation(rawMontoTotal))

  svg
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.4em')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .style('fill', '#64748b')
    .style('letter-spacing', '1px')
    .text('PENDIENTE')
}

watch(
  () => props.resumen,
  async (newVal) => {
    if (newVal) {
      // Priorizamos el dato directo del JSON si viene, si no usamos la prop calculada
      const rawMonto =
        newVal.monto_vouchers_pendientes !== undefined
          ? parseFloat(newVal.monto_vouchers_pendientes)
          : parseFloat(props.montoPendiente) || 0

      await nextTick()
      dibujarGrafica(newVal, rawMonto)
    }
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <q-card class="glass-card full-width column overflow-hidden">
    <q-card-section class="glass-header text-center">
      <div class="text-h6 text-weight-bolder text-white">Análisis General</div>
    </q-card-section>

    <q-card-section
      class="col q-pa-sm column items-center justify-center text-center overflow-hidden"
    >
      <div ref="chartRef" class="q-mb-sm" style="width: 100%; max-width: 180px"></div>
      <div class="text-h5 text-weight-bolder text-primary">
        {{ props.resumen?.total_vouchers || 0 }}
      </div>
      <div class="text-caption text-grey-8 text-uppercase text-weight-bold" style="font-size: 10px">
        Vouchers Analizados ({{ formatCurrency(props.resumen?.monto_total_vouchers) }})
      </div>
    </q-card-section>

    <q-card-section class="q-pa-sm glass-footer">
      <div class="row text-center q-mb-sm">
        <div class="col-6" style="border-right: 1px solid rgba(0, 0, 0, 0.1)">
          <div class="text-caption text-weight-bold text-positive" style="font-size: 10px">
            CONCILIADOS
          </div>
          <div class="text-subtitle2 text-weight-bold text-dark">
            {{ props.resumen?.total_conciliados || 0 }} VCH
          </div>
          <div class="text-caption text-grey-8">
            {{ formatCurrency(props.resumen?.monto_vouchers_conciliados) }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-weight-bold text-warning" style="font-size: 10px">
            PENDIENTES
          </div>
          <div class="text-subtitle2 text-weight-bold text-dark">
            {{ props.resumen?.total_pendientes || 0 }} VCH
          </div>
          <div class="text-caption text-grey-8">
            {{ formatCurrency(props.resumen?.monto_vouchers_pendientes) }}
          </div>
        </div>
      </div>

      <q-separator class="opacity-50 q-my-xs" />

      <div class="row text-center q-pt-xs">
        <div
          class="col-12 text-caption text-weight-bold text-dark-blue q-mb-xs"
          style="font-size: 10px"
        >
          TOTALES ESTADOS DE CUENTA
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-7" style="font-size: 9px; line-height: 1">CARGADO</div>
          <div class="text-caption text-weight-bold text-dark" style="font-size: 11px">
            {{ formatCurrency(props.resumen?.banco_total_cargado) }}
          </div>
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-7" style="font-size: 9px; line-height: 1">
            CONCILIADO
          </div>
          <div class="text-caption text-weight-bold text-positive" style="font-size: 11px">
            {{ formatCurrency(props.resumen?.banco_total_conciliado) }}
          </div>
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-7" style="font-size: 9px; line-height: 1">
            PENDIENTE
          </div>
          <div class="text-caption text-weight-bold text-warning" style="font-size: 11px">
            {{ formatCurrency(props.resumen?.banco_total_pendiente) }}
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.text-dark-blue {
  color: #0f172a;
}
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
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
.opacity-50 {
  opacity: 0.5;
}
</style>
