<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NavigationMenuItem } from '@nuxt/ui';
import { usePermission } from '../logic/usePermission';

const open = ref(true);
const { t } = useI18n();
const { can } = usePermission();

const links = computed<NavigationMenuItem[][]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: t('nav.home'),
      icon: 'i-material-symbols:house',
      to: '/home',
      onSelect: () => { open.value = false },
    },
  ];
  if (can('user.read')) {
    items.push({
      label: t('nav.person'),
      icon: 'i-material-symbols:person',
      to: '/person',
      onSelect: () => { open.value = false },
    });
  }
  if (can('position.read')) {
    items.push({
      label: t('nav.position'),
      icon: 'i-material-symbols:work',
      to: '/position',
      onSelect: () => { open.value = false },
    });
  }
  if (can('department.read')) {
    items.push({
      label: t('nav.department'),
      icon: 'i-material-symbols:local-fire-department-rounded',
      to: '/department',
      onSelect: () => { open.value = false },
    });
  }
  if (can('project.read')) {
    items.push({
      label: t('nav.project'),
      icon: 'i-material-symbols:folder-outline',
      to: '/project',
      onSelect: () => { open.value = false },
    });
  }
  if (can('task.read')) {
    items.push({
      label: t('nav.task'),
      icon: 'i-material-symbols:task',
      to: '/task',
      onSelect: () => { open.value = false },
    });
  }
  if (can('role.manage')) {
    items.push({
      label: t('nav.rolePermission'),
      icon: 'i-lucide-shield-check',
      to: '/role-permission',
      onSelect: () => { open.value = false },
    });
  }
  return [items];
});
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
