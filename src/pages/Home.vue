<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { fetchTaskStatsRequest } from '../api/userApi';
import { usePermission } from '../logic/usePermission';
import type { TaskStats } from '../utils/types';

const { can } = usePermission();

const cards = ref([
  {
    title: '人员',
    description: '人员列表，筛选、过滤、查询、操作，展示团队成员信息。',
    icon: 'i-material-symbols:person',
    to: '/person'
  },
  {
    title: '职位',
    description: '职位列表，隶属部门，职责描述，任职要求，职位创建。',
    icon: 'i-material-symbols:work',
    to: '/position'
  },
  {
    title: '部门',
    description: '部门树状图，层级关系，部门职责，部门管理。',
    icon: 'i-material-symbols:local-fire-department-rounded',
    to: '/department'
  },
  {
    title: '任务',
    description: '任务列表，任务分配，任务进度，任务状态管理。',
    icon: 'i-material-symbols:task',
    to: '/task'
  },
  {
    title: '个人信息',
    description: '查看和编辑个人信息，修改密码，个人设置。',
    icon: 'i-material-symbols:account-circle',
    to: '/me'
  },
  {
    title: '设置',
    description: '全局设置，主题配置，系统配置，用户管理。',
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
  { label: '待办', value: stats.value.todoCount, icon: 'i-lucide-circle', color: 'text-muted' },
  { label: '进行中', value: stats.value.inProgressCount, icon: 'i-lucide-play-circle', color: 'text-info' },
  { label: '审核', value: stats.value.reviewCount, icon: 'i-lucide-eye', color: 'text-warning' },
  { label: '已完成', value: stats.value.completedCount, icon: 'i-lucide-check-circle', color: 'text-success' },
  { label: '已逾期', value: stats.value.overdueCount, icon: 'i-lucide-alert-circle', color: 'text-error' },
  { label: '我的待办', value: stats.value.myTaskCount, icon: 'i-lucide-user', color: 'text-primary' },
]);

watch(
  () => can('task.read'),
  (has) => { if (has) loadStats(); },
  { immediate: true }
);
</script>

<template>
  <DashboardPanel title="首页">
    <UPageCard title="ColdTrack"
      description="ColdTrack 是一个为团队和企业提供人员管理、职位管理、部门管理和任务管理的综合解决方案。助力团队高效协作，提升工作效率，打造团队协作的高校生产力平台。"
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
      <div class="mb-3 text-sm font-medium text-muted">任务概览</div>
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
      加载中...
    </div>
  </DashboardPanel>
</template>

<style scoped></style>

