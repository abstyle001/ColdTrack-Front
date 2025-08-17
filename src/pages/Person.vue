<script setup lang="ts">
import { h, onMounted, ref, resolveComponent, useTemplateRef } from 'vue';
import type { User } from '../utils/types';
import request from '../utils/request';
import { token } from '../hooks/useStorage';
import { deleteUserBatchRequest, fetchUserPageRequest } from '../api/userApi';
import type { AcceptableValue, TableColumn } from '@nuxt/ui';

const toast = useToast();

const loading = ref<boolean>(true);

// 人员表格ref
const table = useTemplateRef('table');
// 批量删除确认框
const open = ref(false)
const page = ref<number>(1);
const userList = ref<User[]>([]);
// 原始的用户列表数据，用于筛选后清空筛选条件
const originalUserList = ref<User[]>([]);
// 用户总数量
const userCount = ref<number>(0);
// 每页显示条目个数，默认为10
const pageSize = ref<number>(10);

const UIcon = resolveComponent('UIcon');
const UAvatar = resolveComponent('UAvatar');
const UCheckbox = resolveComponent('UCheckbox')

const columns: TableColumn<User>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'aria-label': 'Select row'
      })
  },
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
  loading.value = true;
  const data = await fetchUserPageRequest(number, pageSize.value);
  if (data) {
    userList.value = data;
    originalUserList.value = data;
    loading.value = false;
  }
}

// 筛选用户列表
function filter(payload: AcceptableValue) {
  if (!payload) {
    userList.value = originalUserList.value;
    return;
  }
  userList.value = originalUserList.value.filter(user => user.nickName.includes(payload as string) || user.email.includes(payload as string));
}

// 批量删除
async function deleteBatch() {
  const selectedRows = table.value?.tableApi.getSelectedRowModel().rows;
  if (selectedRows === undefined || selectedRows.length === 0) {
    toast.add({
      title: '提示',
      description: '请至少选择一条记录',
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    });
    return;
  }
  // 被选中的用户ID列表
  const selectedIds: string[] = [];
  selectedRows.forEach(row => {
    selectedIds.push(row.original.id);
  });
  const err = await deleteUserBatchRequest(selectedIds);
  if (err) {
    toast.add({
      title: '删除失败',
      description: err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    });
    return;
  }
  toast.add({
    title: '删除成功',
    description: `成功删除${selectedIds.length}条记录`,
    icon: 'i-material-symbols:check-circle-outline',
    color: 'success'
  });
  open.value = false;
  // 更新userList和originalUserList，使界面显示最新数据
  userList.value = userList.value.filter(user => !selectedIds.includes(user.id));
  originalUserList.value = originalUserList.value.filter(user => !selectedIds.includes(user.id));
  table.value?.tableApi.resetRowSelection(); // 清空表格选中状态
}

onMounted(async () => {
  fetchUserCount();
  fetchUserListPage();
});
</script>

<template>
  <DashboardPanel title="人员">
    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <UInput class="max-w-sm" icon="i-lucide-search" placeholder="筛选姓名或邮箱" @update:model-value="filter" />
      <div class="flex flex-wrap items-center gap-1.5">
        <UModal :title="`删除${table?.tableApi.getSelectedRowModel().rows.length}个人员`" v-model:open="open">
          <UButton label="删除" color="error" variant="subtle" icon="i-lucide-trash"></UButton>
          <template #body>
            确定要删除吗，此操作无法撤销？
            <div class="flex justify-end gap-2">
              <UButton label="取消" color="neutral" variant="subtle" @click="open = false" />
              <UButton label="确定" color="error" variant="solid" loading-auto @click="deleteBatch" />
            </div>
          </template>
        </UModal>
      </div>
    </div>
    <UTable ref="table" :loading="loading" loading-color="primary" loading-animation="carousel" :data="userList"
      :columns="columns" class="flex-1" />
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination v-model:page="page" :total="userCount" show-edges size="lg" @update:page="updatePage" />
      </div>
    </div>
  </DashboardPanel>
</template>

<style scoped></style>
