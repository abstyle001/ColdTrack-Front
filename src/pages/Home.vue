<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from 'vue';
import type { User } from '../utils/types';
import request from '../utils/request';
import { token } from '../hooks/useStorage';
import { fetchUserPageRequest } from '../api/userApi';
import type { TableColumn } from '@nuxt/ui';

const page = ref<number>(1);
const userList = ref<User[]>([]);
// 用户总数量
const userCount = ref<number>(0);
// 每页显示条目个数，默认为10
const pageSize = ref<number>(10);

const UIcon = resolveComponent('UIcon');
const UAvatar = resolveComponent('UAvatar');

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'avatar',
    header: '头像',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.avatar,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.nickName),
          h('p', { class: '' }, `@${row.original.nickName}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'userName',
    header: '用户名',
  },
  {
    accessorKey: 'email',
    header: '邮箱',
  },
  {
    accessorKey: 'phone',
    header: '手机',
  },
  {
    accessorKey: 'city',
    header: '城市',
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-2' }, [h(UIcon, { class: 'size-5', name: 'i-meteor-icons:alarm-clock' }), h('span', row.getValue('createdAt'))]);
    }
  },
]

// 获取用户总数量
async function fetchUserCount() {
  const [err, data] = await request<number>('/user/count', 'GET', {
    token: token.value
  });
  if (!err && data) {
    userCount.value = data;
  }
}

// 更新页码
function updatePage(newPage: number) {
  fetchUserListPage(newPage);
}

// 根据页码获取用户列表，不传入默认为1
async function fetchUserListPage(number: number = 1) {
  const data = await fetchUserPageRequest(number, pageSize.value);
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
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="人员" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter emails..."
        />
        <div class="flex flex-wrap items-center gap-1.5">
        </div>
      </div>
      <UTable :data="userList" :columns="columns" class="flex-1" />
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            v-model:page="page"
            :total="userCount"
            show-edges
            size="lg"
            @update:page="updatePage"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped></style>
