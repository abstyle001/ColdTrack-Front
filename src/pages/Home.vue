<script setup lang="ts">
import { ref } from 'vue';

const cards = ref([
  {
    title: '人员',
    description: '人员列表，筛选、过滤、查询、操作，展示团队成员信息。',
    icon: 'i-material-symbols:person',
    to: '/person'
  },
  {
    title: '职位',
    description: '职位列表，从属部门，职责描述，任职要求，职位创建。',
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
])
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
  </DashboardPanel>
</template>

<style scoped></style>
