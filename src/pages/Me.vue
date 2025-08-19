<template>
  <DashboardPanel title="个人信息">
    <UUser :name="userStore.user.nickName" description="软件工程师" :avatar="{
      src: userStore.user.avatar,
    }" size="2xl" />

    <UPageCard title="Tailwind CSS"
      description="Nuxt UI v3 integrates with latest Tailwind CSS v4, bringing significant improvements."
      icon="i-simple-icons-tailwindcss" orientation="horizontal" spotlight spotlight-color="neutral">
    </UPageCard>
  </DashboardPanel>
</template>

<script setup lang="ts">
import { useUserStore } from '../store';

const userStore = useUserStore();
</script>

<style scoped></style>