<script setup lang="ts">
import { ref } from 'vue';
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(true);

const links = [[{
  label: '人员',
  icon: 'i-lucide-house',
  to: '/home',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '职位',
  icon: 'i-lucide-inbox',
  to: '/position',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '部门',
  icon: 'i-lucide-users',
  to: '/department',
  onSelect: () => {
    open.value = false
  }
}, {
  label: '任务',
  icon: 'i-lucide-users',
  to: '/task',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardSidebar id="ColdTrack-Sidebar" v-model:open="open" collapsible resizable class="bg-elevated/25">
    <template #header="{ collapsed }">
      <UUser to="/" :name="collapsed ? '' : 'ColdTrack'" :avatar="{
        src: '/vite.svg'
      }" />
    </template>
    <template #default="{ collapsed }">
      <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
      <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />
      <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
    </template>
    <template #footer="{ collapsed }">
      <UserMenu :collapsed="collapsed" />
    </template>
  </UDashboardSidebar>
</template>

<style scoped></style>
