<script setup>
// Layout base
</script>

<template>
  <q-layout view="lHh Lpr lFf" class="bg-soft-light">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.bg-soft-light {
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
}
</style>
