<script setup lang="ts">
import Sidebar from './Sidebar.vue';
</script>

<template>
  <UDashboardGroup storage="local">
    <Sidebar />
    <router-view />
  </UDashboardGroup>
</template>

<style scoped></style>
