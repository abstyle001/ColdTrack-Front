<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchTaskStatsRequest } from '../api/userApi';
import { usePermission } from '../logic/usePermission';
import type { TaskStats } from '../utils/types';

const { t } = useI18n();
const { can } = usePermission();

const cards = computed(() => [
  {
    title: t('home.cards.person.title'),
    description: t('home.cards.person.description'),
    icon: 'i-material-symbols:person',
    to: '/person'
  },
  {
    title: t('home.cards.position.title'),
    description: t('home.cards.position.description'),
    icon: 'i-material-symbols:work',
    to: '/position'
  },
  {
    title: t('home.cards.department.title'),
    description: t('home.cards.department.description'),
    icon: 'i-material-symbols:local-fire-department-rounded',
    to: '/department'
  },
  {
    title: t('home.cards.project.title'),
    description: t('home.cards.project.description'),
    icon: 'i-ant-design:project-filled',
    to: '/project'
  },
  {
    title: t('home.cards.task.title'),
    description: t('home.cards.task.description'),
    icon: 'i-material-symbols:task',
    to: '/task'
  },
  {
    title: t('home.cards.settings.title'),
    description: t('home.cards.settings.description'),
    icon: 'i-material-symbols:settings',
    to: '/settings'
  }
]);

const stats = ref<TaskStats>({
  total: 0, todoCount: 0, inProgressCount: 0,
  reviewCount: 0, completedCount: 0, overdueCount: 0, myTaskCount: 0,
});
const statsLoading = ref(true);
const statsLoaded = ref(false);

async function loadStats() {
  if (statsLoaded.value) return;
  statsLoading.value = true;
  const data = await fetchTaskStatsRequest();
  if (data) stats.value = data;
  statsLoading.value = false;
  statsLoaded.value = true;
}

const statCards = computed(() => [
  { label: t('home.stats.todo'), value: stats.value.todoCount, icon: 'i-lucide-circle', color: 'text-muted' },
  { label: t('home.stats.inProgress'), value: stats.value.inProgressCount, icon: 'i-lucide-play-circle', color: 'text-info' },
  { label: t('home.stats.review'), value: stats.value.reviewCount, icon: 'i-lucide-eye', color: 'text-warning' },
  { label: t('home.stats.completed'), value: stats.value.completedCount, icon: 'i-lucide-check-circle', color: 'text-success' },
  { label: t('home.stats.overdue'), value: stats.value.overdueCount, icon: 'i-lucide-alert-circle', color: 'text-error' },
  { label: t('home.stats.myTodo'), value: stats.value.myTaskCount, icon: 'i-lucide-user', color: 'text-primary' },
]);

watch(
  () => can('task.read'),
  (has) => { if (has) loadStats(); },
  { immediate: true }
);
</script>

<template>
  <DashboardPanel :title="t('home.title')">
    <UPageCard title="ColdTrack"
      :description="t('home.intro')"
      icon="i-material-icon-theme:3d" orientation="horizontal" spotlight spotlight-color="neutral">
      <h1
        class="text-5xl font-light font-mono italic skew-x-6 bg-gradient-to-r from-white/80 via-blue-300 to-white/80 bg-clip-text text-transparent drop-shadow-lg backdrop-blur-sm opacity-90 tracking-widest">
        ColdTrack
      </h1>
    </UPageCard>
    <UPageGrid>
      <UPageCard v-for="(card, index) in cards" :key="index" v-bind="card" spotlight />
    </UPageGrid>

    <!-- 实时统计大盘 -->
    <div v-if="can('task.read') && !statsLoading" class="mt-6">
      <div class="mb-3 text-sm font-medium text-muted">{{ t('home.overview') }}</div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="s in statCards" :key="s.label"
          class="flex items-center gap-3 rounded-lg border border-default bg-elevated/50 p-4">
          <UIcon :name="s.icon" class="size-5 shrink-0" :class="s.color" />
          <div class="min-w-0">
            <div class="text-xl font-semibold tabular-nums">{{ s.value }}</div>
            <div class="text-xs text-muted truncate">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="can('task.read')" class="mt-6 flex justify-center py-8 text-muted text-sm">
      {{ t('home.loading') }}
    </div>
  </DashboardPanel>
</template>

<style scoped></style>

