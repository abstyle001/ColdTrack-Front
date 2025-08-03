<script setup lang="ts">
import { UserFilled, OfficeBuilding, Box, Checked } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { ref } from 'vue';

// 获取当前路由对象
const route = useRoute();

// 响应式激活菜单索引
const activeMenu = ref(getActiveMenu());

// 计算当前激活的菜单项
function getActiveMenu() {
  // 根据路由路径返回对应的菜单项索引
  const path = route.path;
  if (path === '/') return 'home';
  return path.substring(1) || 'home';
}

// 菜单选择事件处理
function handleMenuSelect(index: string) {
  activeMenu.value = index;
}
</script>

<template>
  <div class="sidebar-container">
    <el-menu
      router
      v-model:default-active="activeMenu"
      background-color="transparent"
      text-color="#606266"
      active-text-color="#409EFF"
      class="custom-menu"
      @select="handleMenuSelect"
    >
      <el-menu-item index="home" class="custom-menu-item">
        <el-icon class="menu-icon"><UserFilled /></el-icon>
        <span>人员</span>
      </el-menu-item>
      <el-menu-item index="position" class="custom-menu-item">
        <el-icon class="menu-icon"><Box /></el-icon>
        <span>职位</span>
      </el-menu-item>
      <el-menu-item index="department" class="custom-menu-item">
        <el-icon class="menu-icon"><OfficeBuilding /></el-icon>
        <span>部门</span>
      </el-menu-item>
      <el-menu-item index="task" class="custom-menu-item">
        <el-icon class="menu-icon"><Checked /></el-icon>
        <span>任务</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.sidebar-container {
  padding: 16px 8px;
  height: 100%;
  box-sizing: border-box;
}

.custom-menu {
  width: 100%;
  border-right: none; /* 移除右侧线条 */
}

.custom-menu-item {
  height: 48px !important;
  margin-bottom: 8px !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
}

.custom-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.08) !important;
}

.custom-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.15) !important;
}

.menu-icon {
  margin-right: 12px;
  font-size: 18px;
}

/* 暗色模式适配 */
.dark .custom-menu-item {
  color: #ccc !important;
}

.dark .custom-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.dark .custom-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.2) !important;
  color: #409EFF !important;
}
</style>
