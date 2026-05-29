<script setup>
const props = defineProps({
  sucursales: { type: Array, default: () => [] },
  selectedId: { type: Number, default: null },
})

const emit = defineEmits(['select-sucursal'])

// Agregamos las nuevas columnas para los conciliados
const columnasSucursales = [
  { name: 'nombre', align: 'left', label: 'SUCURSAL', field: 'nombre', sortable: true },
  { name: 'conciliados', align: 'center', label: 'ÉXITOS', field: 'conciliados', sortable: true },
  {
    name: 'monto_conciliado',
    align: 'right',
    label: 'MONTO CONCILIADO',
    field: 'monto_conciliado',
    sortable: true,
  },
  { name: 'pendientes', align: 'center', label: 'PENDIENTES', field: 'pendientes', sortable: true },
  { name: 'monto', align: 'right', label: 'MONTO PENDIENTE', field: 'monto', sortable: true },
]

const onRowClick = (evt, row) => {
  emit('select-sucursal', row)
}
</script>

<template>
  <q-card class="glass-card full-width column overflow-hidden">
    <q-card-section class="glass-header row items-center">
      <q-icon name="storefront" size="sm" class="q-mr-sm text-blue-3" />
      <div class="text-h6 text-weight-bolder text-white">Desglose por Sucursal</div>
      <q-space />
      <div class="text-caption text-grey-4">Clickea una fila para ver gráfica</div>
    </q-card-section>

    <q-card-section class="col q-pa-none scroll">
      <q-table
        flat
        :rows="props.sucursales"
        :columns="columnasSucursales"
        row-key="id"
        hide-pagination
        :rows-per-page-options="[0]"
        class="glass-table bg-transparent"
        style="min-width: 450px"
        @row-click="onRowClick"
      >
        <template v-slot:header="props">
          <q-tr :props="props" class="glass-th">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-weight-bold text-grey-8 letter-spacing"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr
            :props="props"
            class="cursor-pointer transition-row"
            :class="{ 'row-selected': props.row.id === selectedId }"
            @click="onRowClick($event, props.row)"
          >
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <template v-if="col.name === 'pendientes'">
                <q-badge
                  color="orange-9"
                  text-color="white"
                  class="text-weight-bold q-pa-sm shadow-1"
                >
                  {{ col.value }}
                </q-badge>
              </template>

              <template v-else-if="col.name === 'conciliados'">
                <q-badge
                  color="positive"
                  text-color="white"
                  class="text-weight-bold q-pa-sm shadow-1"
                >
                  {{ col.value }}
                </q-badge>
              </template>

              <template v-else-if="col.name === 'monto_conciliado'">
                <span class="text-weight-bold text-positive">{{ col.value }}</span>
              </template>

              <template v-else-if="col.name === 'monto'">
                <span
                  class="text-weight-bold"
                  :class="props.row.id === selectedId ? 'text-primary' : 'text-grey-9'"
                >
                  {{ col.value }}
                </span>
              </template>

              <template v-else>
                <span :class="{ 'text-weight-bold text-primary': props.row.id === selectedId }">
                  {{ col.value }}
                </span>
              </template>
            </q-td>
          </q-tr>
        </template>
      </q-table>
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

.glass-table {
  width: 100%;
}
.glass-table :deep(.q-table__container) {
  max-width: 100%;
  overflow-x: auto;
}
.glass-table :deep(thead tr:first-child th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(245, 245, 245, 0.95);
}
.glass-th {
  background: rgba(255, 255, 255, 0.3) !important;
}
.glass-table :deep(th) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}
.glass-table :deep(td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
}

.transition-row {
  transition: background-color 0.2s ease;
}
.transition-row:hover {
  background: rgba(59, 130, 246, 0.05) !important;
}
.row-selected {
  background: rgba(59, 130, 246, 0.1) !important;
  border-left: 4px solid #3b82f6;
}
</style>
