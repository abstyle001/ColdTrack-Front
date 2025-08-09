<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';
import { Sunny, Moon, User, Edit, DeleteFilled } from '@element-plus/icons-vue';
import { onMounted } from 'vue';
import { getTokenClaimRequest, getUserInfoRequest } from '../api/userApi';
import { useUserStore } from '../store';

const isDark = useDark();
const toggleDark = useToggle(isDark);
const userStore = useUserStore();

// 个人信息操作方法
const viewProfile = () => {
  console.log('查看个人信息');
};

const editProfile = () => {
  // 编辑资料逻辑
  console.log('编辑资料');
};

const logout = () => {
  // 退出登录逻辑
  console.log('退出登录');
};

async function getUserInfo(id: string) {
  const user = await getUserInfoRequest(id);
  if (user) {
    userStore.updateUser(user);
  }
}

onMounted(async () => {
  // 获取token相关信息，拿到id
  const token = await getTokenClaimRequest();
  if (token) {
    // 获取用户信息
    getUserInfo(token.id);
  }
});
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
      <el-popover placement="bottom-start" trigger="hover" :width="240" transition="fade-in-down"
        popper-class="user-popover">
        <template #reference>
          <el-avatar :size="42" :src='userStore.user.avatar' />
        </template>
        <div class="flex flex-col justify-center items-center p-3 space-y-1">
          <!-- 个人信息 -->
          <div class="flex items-center space-x-3 p-2 rounded-lg">
            <el-avatar :size="50"
              :src='userStore.user.avatar' />
            <div>
              <h3 class="font-bold text-base">{{ userStore.user.nickName }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-xs">产品经理</p>
            </div>
          </div>
          <!-- 操作按钮 -->
          <div class="flex flex-col justify-center items-center space-y-1">
            <el-button @click="viewProfile" type="text" :icon="User"
              class="w-full justify-start py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" size="small">
              个人信息
            </el-button>
            <el-button @click="editProfile" type="text" :icon="Edit"
              class="w-full justify-start py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" size="small">
              编辑资料
            </el-button>
            <el-button @click="logout" type="text" :icon="DeleteFilled"
              class="w-full justify-start py-2 rounded-md hover:bg-red-50 dark:hover:bg-gray-800 text-red-500"
              size="small">
              退出登录
            </el-button>
          </div>
        </div>
      </el-popover>
      <el-button @click="toggleDark()" :icon="isDark ? Moon : Sunny" type="primary" text bg round />
    </div>
  </header>
</template>

<style scoped>
/* 自定义悬浮卡片样式 */
.el-popper.user-popover {
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  overflow: hidden;
  margin-left: -30px !important;
}

/* 按钮图标与文字间距 */
.el-button .el-icon {
  margin-right: 8px;
}

/* 优化暗色模式下的显示 */
.dark .user-popover {
  background-color: #1f2937;
  color: #f3f4f6;
}
</style>
