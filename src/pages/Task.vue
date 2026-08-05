<script setup lang="ts">
import { h, ref, resolveComponent, useTemplateRef, computed } from 'vue';
import type { Task } from '../utils/types';
import type { TableColumn } from '@nuxt/ui';
import { useTask } from '../logic/useTask';
import { usePermission } from '../logic/usePermission';
import {
  createTaskRequest,
  updateTaskRequest,
  deleteTaskRequest,
} from '../api/userApi';

const { can } = usePermission();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table: any = useTemplateRef("table");
const toast = useToast();

const {
  taskList,
  loading,
  taskCount,
  open,
  statusFilter,
  priorityFilter,
  userList,
  updatePage,
  fetchList,
  fetchCount,
  applyFilter,
  filter,
  deleteBatch,
} = useTask(table);

const statusOptions = [
  { label: '待办', value: 'Todo' },
  { label: '进行中', value: 'InProgress' },
  { label: '审核', value: 'Review' },
  { label: '已完成', value: 'Completed' },
];

const priorityOptions = [
  { label: '低', value: 'Low' },
  { label: '中', value: 'Medium' },
  { label: '高', value: 'High' },
  { label: '紧急', value: 'Urgent' },
];

const userOptions = computed(() =>
  userList.value.map((u) => ({ label: u.nickName || u.userName, value: u.id }))
);

// ===== 创建 / 编辑弹窗 =====
const formOpen = ref(false);
const formSaving = ref(false);
const editTarget = ref<Task | null>(null);
type TaskStatus = 'Todo' | 'InProgress' | 'Review' | 'Completed';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

const form = ref<{
  title: string;
  description: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
}>({
  title: '',
  description: '',
  assigneeId: '',
  priority: 'Medium',
  status: 'Todo',
  deadline: '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deadlineDate: any = ref(undefined);
const deadlineTime: any = ref(undefined);
const popoverOpen = ref(false);

function openCreate() {
  console.log("openCreate called");
  editTarget.value = null;
  form.value = {
    title: '',
    description: '',
    assigneeId: '',
    priority: 'Medium',
    status: 'Todo',
    deadline: '',
  };
  deadlineDate.value = undefined;
  deadlineTime.value = undefined;
  popoverOpen.value = false;
  formOpen.value = true;
}

function openEdit(task: Task) {
  editTarget.value = task;
  form.value = {
    title: task.title,
    description: task.description || '',
    assigneeId: task.assigneeId || '',
    priority: task.priority,
    status: task.status,
    deadline: task.deadline ? task.deadline.replace(' ', 'T') : '',
  };
  deadlineDate.value = task.deadline ? new Date(task.deadline.replace(' ', 'T')) : undefined;
  deadlineTime.value = task.deadline ? new Date(task.deadline.replace(' ', 'T')) : undefined;
  popoverOpen.value = false;
  formOpen.value = true;
}

async function submitForm() {
  console.log("submitForm called, title:", form.value.title);
  if (!form.value.title || formSaving.value) return;
  formSaving.value = true;
  let err: string | null = null;
  if (editTarget.value) {
    const r = await updateTaskRequest({
      id: editTarget.value.id,
      ...form.value,
      deadline: deadlineDate.value ? formatDate(deadlineDate.value) + 'T' + formatTime(deadlineTime.value) + ':00' : undefined,
    });
    err = r.err;
  } else {
    const r = await createTaskRequest({
      ...form.value,
      deadline: deadlineDate.value ? formatDate(deadlineDate.value) + 'T' + formatTime(deadlineTime.value) + ':00' : undefined,
    });
    err = r.err;
  }
  formSaving.value = false;
  if (err) {
    toast.add({
      title: "操作失败",
      description: err,
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  toast.add({
    title: editTarget.value ? "更新成功" : "创建成功",
    description: editTarget.value ? "任务已更新" : "新任务已创建",
    icon: "i-material-symbols:check-circle-outline",
    color: "success",
  });
  formOpen.value = false;
  fetchCount();
  fetchList();
}

// ===== 删除确认 =====
const deleteTarget = ref<Task | null>(null);
const deleteOpen = ref(false);

function confirmDelete(task: Task) {
  deleteTarget.value = task;
  deleteOpen.value = true;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  const err = await deleteTaskRequest(deleteTarget.value.id);
  if (err) {
    toast.add({
      title: "删除失败",
      description: err,
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  toast.add({
    title: "删除成功",
    description: "任务已删除",
    icon: "i-material-symbols:check-circle-outline",
    color: "success",
  });
  deleteOpen.value = false;
  fetchCount();
  fetchList();
}

// ===== 状态/优先级标签 =====
const statusColor: Record<string, string> = {
  Todo: 'neutral',
  InProgress: 'info',
  Review: 'warning',
  Completed: 'success',
};
const statusLabel: Record<string, string> = {
  Todo: '待办',
  InProgress: '进行中',
  Review: '审核',
  Completed: '已完成',
};

const priorityColor: Record<string, string> = {
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Urgent: 'error',
};
const priorityLabel: Record<string, string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Urgent: '紧急',
};

function formatTime(d: any): string {
  if (d && typeof d.year === 'number') {
    const pad = (n: any) => String(Math.floor(Number(n) || 0)).padStart(2, '0');
    return pad(typeof d.hour === 'number' ? d.hour : 0) + ':' + pad(typeof d.minute === 'number' ? d.minute : 0);
  }
  if (d && typeof d.getHours === 'function') {
    const pad = (n: any) => String(Math.floor(Number(n) || 0)).padStart(2, '0');
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  return '00:00';
}

function formatDate(d: any): string {
  const pad = (n: any) => String(Math.floor(Number(n) || 0)).padStart(2, '0');
  if (d && typeof d.year === 'number') {
    return d.year + '-' + pad(d.month) + '-' + pad(d.day);
  }
  if (d && typeof d.getMonth === 'function') {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  return '';
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

const page = ref<number>(1);

const UIcon = resolveComponent('UIcon');
const UCheckbox = resolveComponent('UCheckbox');
const UBadge = resolveComponent('UBadge');

const columns: TableColumn<Task>[] = [
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
      }),
  },
  {
    accessorKey: 'title',
    header: '标题',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UBadge, {
          label: statusLabel[row.original.status] || row.original.status,
          color: statusColor[row.original.status] || 'neutral',
          variant: 'solid',
          size: 'xs',
        }),
        h('span', { class: 'font-medium' }, row.original.title),
      ]);
    },
  },
  {
    id: 'assignee',
    header: '负责人',
    cell: ({ row }) => {
      const name = row.original.assigneeName || '—';
      return h('span', { class: row.original.assigneeName ? '' : 'text-muted' }, name);
    },
  },
  {
    id: 'priority',
    header: '优先级',
    cell: ({ row }) => {
      return h(UBadge, {
        label: priorityLabel[row.original.priority] || row.original.priority,
        color: priorityColor[row.original.priority] || 'neutral',
        variant: 'soft',
        size: 'xs',
      });
    },
  },
  {
    accessorKey: 'deadline',
    header: '截止日期',
    cell: ({ row }) => {
      const deadline = row.original.deadline;
      if (!deadline) return h('span', { class: 'text-muted' }, '—');
      const overdue = isOverdue(deadline);
      return h('span', { class: overdue ? 'text-error font-medium' : '' }, [
        h(UIcon, { class: 'size-4 inline-block mr-1', name: 'i-material-symbols:calendar-clock-outline-rounded' }),
        h('span', deadline),
      ]);
    },
  },
  {
    accessorKey: 'creatorName',
    header: '创建人',
    cell: ({ row }) =>
      h('span', { class: 'text-muted' }, row.original.creatorName || '—'),
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-2' }, [
        h(UIcon, { class: 'size-5', name: 'i-meteor-icons:alarm-clock' }),
        h('span', row.getValue('createdAt')),
      ]);
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const UButton = resolveComponent('UButton');
      const buttons = [];
      if (can('task.update')) {
        buttons.push(
          h(UButton, {
            size: 'xs',
            variant: 'ghost',
            label: '编辑',
            onClick: () => openEdit(row.original),
          })
        );
      }
      if (can('task.delete')) {
        buttons.push(
          h(UButton, {
            size: 'xs',
            variant: 'ghost',
            color: 'error',
            label: '删除',
            onClick: () => confirmDelete(row.original),
          })
        );
      }
      if (buttons.length === 0) return null;
      return h('div', { class: 'flex items-center gap-1' }, buttons);
    },
  },
];
</script>

<template>
  <DashboardPanel title="任务管理">
    <template v-if="can('task.read')">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <UInput class="max-w-sm" icon="i-lucide-search" placeholder="筛选标题或描述" @update:model-value="filter" />
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="按状态筛选"
            class="w-32"
            @update:model-value="applyFilter()"
          />
          <USelect
            v-model="priorityFilter"
            :items="priorityOptions"
            placeholder="按优先级筛选"
            class="w-32"
            @update:model-value="applyFilter()"
          />
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <UButton v-if="can('task.create')" label="新建任务" icon="i-lucide-plus" @click="openCreate" />
          <UButton v-if="can('task.delete')" label="删除" color="error" variant="subtle" icon="i-lucide-trash"  @click="open = true" />
          <UModal :title="`删除${table?.tableApi.getSelectedRowModel().rows.length}个任务`" v-model:open="open">
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

      <UTable
        ref="table"
        :loading="loading"
        loading-color="primary"
        loading-animation="carousel"
        :data="taskList"
        :columns="columns"
        class="flex-1"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted" />
        <div class="flex items-center gap-1.5">
          <UPagination v-model:page="page" :total="taskCount" show-edges size="lg" @update:page="updatePage" />
        </div>
      </div>

      <!-- 新建 / 编辑任务 -->
      <UModal v-model:open="formOpen" :title="editTarget ? '编辑任务' : '新建任务'" size="xl">
        <template #body>
          <div class="flex flex-col gap-3">
            <UFormField label="标题" required>
              <UInput v-model="form.title" placeholder="请输入任务标题" class="w-full" />
            </UFormField>
            <UFormField label="描述">
              <UTextarea v-model="form.description" placeholder="任务描述（可选）" class="w-full" :rows="3" />
            </UFormField>
            <UFormField label="负责人">
              <USelect
                v-model="form.assigneeId"
                :items="userOptions"
                placeholder="选择负责人"
                class="w-full"
              />
            </UFormField>
            <div class="flex gap-3">
              <UFormField label="优先级" class="flex-1">
                <USelect
                  v-model="form.priority"
                  :items="priorityOptions"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="flex gap-3">
              <UFormField label="截止日期">
                <UInputDate v-model="deadlineDate">
                  <template #trailing>
                    <UPopover v-model:open="popoverOpen">
                      <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date" class="px-0" />
                      <template #content>
                        <UCalendar v-model="deadlineDate" @update:model-value="popoverOpen = false" class="p-2" />
                      </template>
                    </UPopover>
                  </template>
                </UInputDate>
              </UFormField>
              <UFormField label="时间" class="w-28">
                <UInputTime v-model="deadlineTime" />
              </UFormField>
            </div>
            <UFormField v-if="editTarget" label="状态">
              <USelect
                v-model="form.status"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="取消" color="neutral" variant="subtle" @click="formOpen = false" />
            <UButton label="保存" color="primary" :loading="formSaving" @click="submitForm" />
          </div>
        </template>
      </UModal>

      <!-- 删除确认 -->
      <UModal v-model:open="deleteOpen" title="删除任务">
        <template #body>
          确定要删除任务「{{ deleteTarget?.title }}」吗，此操作无法撤销？
          <div class="flex justify-end gap-2 mt-4">
            <UButton label="取消" color="neutral" variant="subtle" @click="deleteOpen = false" />
            <UButton label="确定" color="error" variant="solid" @click="doDelete" />
          </div>
        </template>
      </UModal>
    </template>

    <template v-else>
      <div class="flex flex-col items-center justify-center py-16 text-muted">
        <UIcon name="i-lucide-shield-x" class="size-12 mb-4 opacity-40" />
        <p class="text-lg">您没有访问此页面的权限</p>
      </div>
    </template>
  </DashboardPanel>
</template>

<style scoped></style>
