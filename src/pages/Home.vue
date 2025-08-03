<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { User } from '../utils/types';
import request from '../utils/request';
import { token } from '../hooks/useStorage';
import { fetchUserPageRequest } from '../api/userApi';

const userList = ref<User[]>([]);
// 用户总数量
const userCount = ref<number>(0);
// 每页显示条目个数，默认为10
const pageSize = ref<number>(10);

// 获取用户总数量
async function fetchUserCount() {
  const [err, data] = await request<number>('/user/count', 'GET', {
    token: token.value
  });
  if (!err && data) {
    userCount.value = data;
  }
}

// 根据页码获取用户列表，不传入默认为1
async function fetchUserListPage(number: number = 1) {
  const data = await fetchUserPageRequest(number, pageSize.value);
  if (data) {
    userList.value = data;
  }
}

// 改变页码或每页条目个数
async function changePageNumerOrPageSize(currentPage: number, pageSize: number) {
  const data = await fetchUserPageRequest(currentPage, pageSize);
  if (data) {
    userList.value = data;
  }
}

onMounted(async () => {
  fetchUserCount();
  fetchUserListPage();
});
</script>

<template>
  <div class="px-4 flex flex-col items-center space-y-4">
    <el-table stripe :data="userList" border>
      <el-table-column label="头像" width="80">
        <template #default="scope">
          <div class="flex justify-center items-center">
            <el-avatar :src="scope.row.avatar" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="用户名" width="180" />
      <el-table-column prop="nickName" label="昵称" width="180" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="手机" width="180" />
      <el-table-column prop="city" label="城市" width="180" />
      <el-table-column label="创建时间">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <el-icon>
              <timer />
            </el-icon>
            <span style="margin-left: 10px;">{{ (scope.row as User).createdAt }}</span>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination background layout="prev, pager, next" :total="userCount" :page-size="pageSize"
      @prev-click="fetchUserListPage" @next-click="fetchUserListPage" @change="changePageNumerOrPageSize" />
  </div>
</template>

<style scoped></style>
