<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :title="title" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <slot></slot>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { title } = defineProps<{
  title?: string
}>();
</script>

<style scoped></style>