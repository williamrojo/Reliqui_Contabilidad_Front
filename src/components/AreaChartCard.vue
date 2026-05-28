<script setup>
import { ref, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  sucursal: { type: Object, default: null },
})

const chartRef = ref(null)
const chartStats = ref(null)

const formatAbbreviation = (num) => {
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'k'
  return '$' + num.toFixed(0)
}

const dibujarAreaChart = (detalles) => {
  if (!chartRef.value || !detalles || detalles.length === 0) return

  const container = d3.select(chartRef.value)
  container.selectAll('*').remove()

  const data = detalles.map((d) => ({
    date: new Date(d.fecha + 'T00:00:00'),
    value: parseFloat(d.monto.replace(/[$,]/g, '')) || 0,
    rawMonto: d.monto,
    fechaStr: d.fecha,
    pendientes: d.pendientes,
  }))

  const width = 700
  const height = 240
  const margin = { top: 20, right: 20, bottom: 25, left: 50 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  container
    .style('position', 'relative')
    .style('width', '100%')
    .style('display', 'flex')
    .style('justify-content', 'center')

  const svg = container
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', 'auto')
    .style('max-height', '260px')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  let domainX = d3.extent(data, (d) => d.date)
  if (domainX[0].getTime() === domainX[1].getTime()) {
    domainX = [d3.timeDay.offset(domainX[0], -1), d3.timeDay.offset(domainX[1], 1)]
  }

  const x = d3.scaleTime().domain(domainX).range([0, innerWidth])
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) * 1.2])
    .range([innerHeight, 0])

  // Ejes
  const xAxis = svg
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat('%d %b')))
    .attr('color', '#64748b')
  xAxis.selectAll('text').style('font-size', '10px')

  const yAxis = svg
    .append('g')
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `$${formatAbbreviation(d).replace('$', '')}`),
    )
    .attr('color', '#64748b')
  yAxis.selectAll('text').style('font-size', '10px')

  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0(innerHeight)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX)
  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX)

  const defs = svg.append('defs')
  const gradient = defs
    .append('linearGradient')
    .attr('id', 'gradientArea')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')
  gradient
    .append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#3b82f6')
    .attr('stop-opacity', 0.4)
  gradient
    .append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#3b82f6')
    .attr('stop-opacity', 0)

  // ANIMACIÓN MÁSCARA (Área)
  const clipId = `clip-${Math.random().toString(36).substring(2, 9)}`
  svg
    .append('clipPath')
    .attr('id', clipId)
    .append('rect')
    .attr('width', 0)
    .attr('height', innerHeight)
    .transition()
    .duration(1200)
    .ease(d3.easeCubicInOut)
    .attr('width', innerWidth)

  svg
    .append('path')
    .datum(data)
    .attr('fill', 'url(#gradientArea)')
    .attr('clip-path', `url(#${clipId})`)
    .attr('d', area)

  // ANIMACIÓN LÍNEA PRINCIPAL (De Izquierda a Derecha)
  const pathLine = svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#2563eb')
    .attr('stroke-width', 2)
    .attr('d', line)

  const totalLength = pathLine.node().getTotalLength()

  pathLine
    .attr('stroke-dasharray', totalLength + ' ' + totalLength)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(1200)
    .ease(d3.easeCubicInOut)
    .attr('stroke-dashoffset', 0)

  // ESTADÍSTICAS
  const maxValue = d3.max(data, (d) => d.value)
  const minValue = d3.min(data, (d) => d.value)
  const avgValue = d3.mean(data, (d) => d.value)

  chartStats.value = { max: maxValue, min: minValue, avg: avgValue }

  const drawStatLine = (val, color) => {
    if (isNaN(val)) return
    svg
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y(val))
      .attr('y2', y(val))
      .attr('stroke', color)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
  }

  drawStatLine(maxValue, '#ef4444')
  if (minValue !== maxValue) drawStatLine(minValue, '#10b981')
  if (avgValue !== maxValue && avgValue !== minValue) drawStatLine(avgValue, '#f59e0b')

  // TOOLTIP OPACA (BLANCO SÓLIDO)
  const tooltip = container
    .append('div')
    .style('position', 'absolute')
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('padding', '6px 10px')
    .style('font-size', '11px')
    .style('z-index', 9999)
    .style('background', '#ffffff')
    .style('border', '1px solid #cbd5e1')
    .style('border-radius', '6px')
    .style('box-shadow', '0 4px 10px rgba(0,0,0,0.15)')

  svg
    .selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.date))
    .attr('cy', (d) => y(d.value))
    .attr('r', 4)
    .attr('fill', '#ffffff')
    .attr('stroke', '#2563eb')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .attr('opacity', 0)
    .transition()
    .delay(1000)
    .duration(500)
    .attr('opacity', 1)

  svg
    .selectAll('circle')
    .on('mouseover', function (event, d) {
      d3.select(this).attr('r', 5.5).attr('fill', '#2563eb')
      const [xPos, yPos] = d3.pointer(event, container.node())
      tooltip.transition().duration(200).style('opacity', 1)
      tooltip
        .html(
          `
          <div class="text-weight-bold text-dark">${d.fechaStr}</div>
          <div class="text-primary text-weight-bolder" style="font-size:13px;">${d.rawMonto}</div>
          <div class="text-grey-6 text-weight-medium" style="font-size:10px;">${d.pendientes} vouchers</div>
        `,
        )
        .style('left', xPos + 10 + 'px')
        .style('top', yPos - 25 + 'px')
    })
    .on('mouseout', function () {
      d3.select(this).attr('r', 4).attr('fill', '#ffffff')
      tooltip.transition().duration(200).style('opacity', 0)
    })
}

watch(
  () => props.sucursal,
  async (newVal) => {
    chartStats.value = null
    if (newVal && newVal.detalles) {
      await nextTick()
      dibujarAreaChart(newVal.detalles)
    }
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <q-card class="glass-card column overflow-hidden q-mt-lg centered-card">
    <q-card-section class="glass-header row items-center">
      <q-icon name="insights" size="sm" class="q-mr-sm text-blue-3" />
      <div class="text-h6 text-weight-bolder text-white">
        Tendencia Diaria
        <span v-if="props.sucursal" class="text-grey-4">— {{ props.sucursal.nombre }}</span>
      </div>
    </q-card-section>

    <q-card-section
      class="q-pa-md text-center flex-grow flex column flex-center"
      style="min-height: 280px"
    >
      <div v-if="props.sucursal" class="row no-wrap full-width items-center justify-center">
        <div class="col" ref="chartRef" style="min-width: 0"></div>

        <div
          class="col-auto q-pl-lg column items-start justify-center text-left"
          v-if="chartStats"
          style="width: 170px"
        >
          <div
            class="text-caption text-weight-bolder text-grey-6 q-mb-md text-uppercase letter-spacing"
          >
            Métricas del Periodo
          </div>

          <div class="row items-center q-mb-sm">
            <div
              style="width: 20px; height: 3px; background: #ef4444; border-radius: 2px"
              class="q-mr-md"
            ></div>
            <div class="text-body2 text-weight-bold text-dark">
              <span class="text-grey-7 q-mr-sm">MAX</span> {{ formatAbbreviation(chartStats.max) }}
            </div>
          </div>

          <div class="row items-center q-mb-sm" v-if="chartStats.min !== chartStats.max">
            <div
              style="width: 20px; height: 3px; background: #10b981; border-radius: 2px"
              class="q-mr-md"
            ></div>
            <div class="text-body2 text-weight-bold text-dark">
              <span class="text-grey-7 q-mr-sm">MIN</span> {{ formatAbbreviation(chartStats.min) }}
            </div>
          </div>

          <div
            class="row items-center"
            v-if="chartStats.avg !== chartStats.max && chartStats.avg !== chartStats.min"
          >
            <div
              style="width: 20px; height: 3px; background: #f59e0b; border-radius: 2px"
              class="q-mr-md"
            ></div>
            <div class="text-body2 text-weight-bold text-dark">
              <span class="text-grey-7 q-mr-sm">AVG</span> {{ formatAbbreviation(chartStats.avg) }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center opacity-60 q-py-lg">
        <q-icon name="ads_click" size="4rem" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-8">Selecciona una Sucursal</div>
        <div class="text-grey-7">
          Haz clic en una fila de la tabla superior para visualizar su tendencia analítica.
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
/* REGLA DE CENTRADO Y ANCHO MÁXIMO */
.centered-card {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

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
.letter-spacing {
  letter-spacing: 1px;
}
.opacity-60 {
  opacity: 0.6;
}
</style>
