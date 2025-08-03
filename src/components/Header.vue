<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';
import { Sunny, Moon } from '@element-plus/icons-vue';

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <header class="flex justify-between items-center py-2 px-8 rounded-lg">
    <!-- 左侧 -->
    <div class="flex justify-center items-center space-x-4">
      <el-image class="w-12" src="vite.svg" afit="fit" />
      <h1 class="font-bold text-2xl">ColdTrack</h1>
    </div>
    <!-- 右侧 -->
    <div class="flex justify-center items-center space-x-4">
      <el-avatar :size="42" src='http://localhost:5000/statics/avatars/53812f60-7df9-420f-99a5-52d208d7979c.jpg' />
      <el-button @click="toggleDark()" :icon="isDark ? Moon : Sunny" type="primary" text bg round />
    </div>
  </header>
</template>

<style scoped></style>
