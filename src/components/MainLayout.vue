<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';
</script>

<template>
  <Header />
  <el-row>
    <el-col :span="4">
      <Sidebar />
    </el-col>
    <el-col :span="20">
      <router-view></router-view>
    </el-col>
  </el-row>
</template>

<style scoped>
</style>
