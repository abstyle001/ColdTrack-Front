<script setup lang="ts">
import { h, ref, resolveComponent, useTemplateRef } from 'vue';
import type { User } from '../utils/types';
import type { TableColumn } from '@nuxt/ui';
import { usePerson } from '../logic/usePerson';

// 人员表格ref
const table = useTemplateRef("table");

const {
  userList,
  loading,
  userCount,
  open,
  updatePage,
  filter,
  deleteBatch
} = usePerson(table);

const page = ref<number>(1);

const UIcon = resolveComponent('UIcon');
const UAvatar = resolveComponent('UAvatar');
const UCheckbox = resolveComponent('UCheckbox');

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
