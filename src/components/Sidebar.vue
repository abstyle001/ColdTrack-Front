<script setup lang="ts">
import { ref } from 'vue';
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(true);

const links = [[
  {
    label: '首页',
    icon: 'i-material-symbols:house',
    to: '/home',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: '人员',
    icon: 'i-material-symbols:person',
    to: '/person',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '职位',
    icon: 'i-material-symbols:work',
    to: '/position',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '部门',
    icon: 'i-material-symbols:local-fire-department-rounded',
    to: '/department',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '任务',
    icon: 'i-material-symbols:task',
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
      }"
        class="font-light font-mono italic skew-x-6 bg-gradient-to-r from-white/80 via-blue-300 to-white/80 bg-clip-text text-transparent drop-shadow-lg backdrop-blur-sm opacity-90 tracking-widest" />
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
