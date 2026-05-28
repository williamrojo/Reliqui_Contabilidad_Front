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
      const rawMonto = parseFloat(props.montoPendiente) || 0
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
      class="col q-pa-md column items-center justify-center text-center overflow-hidden"
    >
      <div ref="chartRef" class="q-mb-sm" style="width: 100%; max-width: 200px"></div>
      <div class="text-h4 text-weight-bolder text-primary q-mt-sm">
        {{ props.resumen?.total_vouchers || 0 }}
      </div>
      <div class="text-caption text-grey-8 text-uppercase text-weight-bold">
        Vouchers Analizados
      </div>
    </q-card-section>

    <q-card-section class="q-pa-md glass-footer">
      <q-list class="q-py-none">
        <q-item>
          <q-item-section avatar
            ><q-icon name="circle" color="positive" size="xs"
          /></q-item-section>
          <q-item-section
            ><q-item-label class="text-weight-bold text-grey-8"
              >Exitosos</q-item-label
            ></q-item-section
          >
          <q-item-section side class="text-subtitle1 text-positive text-weight-bold">{{
            props.resumen?.total_conciliados || 0
          }}</q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar><q-icon name="circle" color="warning" size="xs" /></q-item-section>
          <q-item-section
            ><q-item-label class="text-weight-bold text-grey-8"
              >Pendientes</q-item-label
            ></q-item-section
          >
          <q-item-section side class="text-subtitle1 text-warning text-weight-bold">{{
            props.resumen?.total_pendientes || 0
          }}</q-item-section>
        </q-item>
      </q-list>
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
</style>
