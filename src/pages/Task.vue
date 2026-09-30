<script setup lang="ts">
import { h, ref, resolveComponent, useTemplateRef, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { parseDateTime, toCalendarDate, toTime } from '@internationalized/date';
import type { CalendarDateTime } from '@internationalized/date';
import type { Task, Tag } from '../utils/types';
import type { TableColumn, AcceptableValue } from '@nuxt/ui';
import { useTask } from '../logic/useTask';
import { usePermission } from '../logic/usePermission';
import { useUserStore } from '../store';
import TaskKanban from '../components/TaskKanban.vue';
import TaskDetailDrawer from '../components/TaskDetailDrawer.vue';
import {
  fetchTaskListRequest,
  fetchProjectDetailRequest,
  createTaskRequest,
  updateTaskRequest,
  deleteTaskRequest,
  createTagRequest,
  updateTagRequest,
  deleteTagRequest,
} from '../api/userApi';

const { t } = useI18n();
const { can } = usePermission();
const userStore = useUserStore();
const route = useRoute();

// 可见性由后端统一控制（自己的任务 + 负责/参与的项目任务），前端不再强制按负责人过滤

// 从路由 query 初始化项目筛选（项目页「查看任务」跳转过来时生效）
const initialProjectId = Number(route.query.projectId) || undefined;

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
  tagFilter,
  projectFilter,
  tagList,
  projectList,
  updatePage,
  fetchList,
  fetchCount,
  fetchTags,
  applyFilter,
  filter,
  deleteBatch,
  batchUpdateStatus,
} = useTask(table, undefined, initialProjectId);

// 项目负责人可在自己负责的项目内新建/编辑/删除任务（后端同样放行，此处控制按钮显隐）
const managedProjectIds = computed(() =>
  projectList.value.filter((p) => p.managerId === userStore.user.id).map((p) => p.id)
);
const canCreateTask = computed(() => can('task.create') || managedProjectIds.value.length > 0);
const canEditTask = (task: Task) => can('task.update') || managedProjectIds.value.includes(task.projectId);
const canDeleteTask = (task: Task) => can('task.delete') || managedProjectIds.value.includes(task.projectId);

const statusOptions = computed(() => [
  { label: t('task.status.todo'), value: 'Todo' },
  { label: t('task.status.inProgress'), value: 'InProgress' },
  { label: t('task.status.review'), value: 'Review' },
  { label: t('task.status.completed'), value: 'Completed' },
]);

const priorityOptions = computed(() => [
  { label: t('task.priority.low'), value: 'Low' },
  { label: t('task.priority.medium'), value: 'Medium' },
  { label: t('task.priority.high'), value: 'High' },
  { label: t('task.priority.urgent'), value: 'Urgent' },
]);

const projectOptions = computed(() =>
  projectList.value.map((p) => ({ label: p.name, value: p.id }))
);

// 表单中的项目下拉：无全局 task.create 权限的负责人只能选自己负责的项目（后端同样会拦截）
const formProjectOptions = computed(() =>
  can('task.create')
    ? projectOptions.value
    : projectOptions.value.filter((o) => managedProjectIds.value.includes(o.value as number))
);

// 筛选器使用字符串值，与 statusFilter/priorityFilter 保持一致
const projectFilterOptions = computed(() =>
  projectList.value.map((p) => ({ label: p.name, value: String(p.id) }))
);

const tagOptions = computed(() =>
  tagList.value.map((t) => ({ label: t.name, value: String(t.id) }))
);

// 注意：Reka UI 的 SelectItem 不允许空字符串 value（会抛错并锁死页面点击），
// 「默认」用哨兵值 'default'，变更时映射回空字符串
const tagColorOptions = computed(() => [
  { label: t('task.tagColor.default'), value: 'default' },
  { label: t('task.tagColor.primary'), value: 'primary' },
  { label: t('task.tagColor.neutral'), value: 'neutral' },
  { label: t('task.tagColor.info'), value: 'info' },
  { label: t('task.tagColor.success'), value: 'success' },
  { label: t('task.tagColor.warning'), value: 'warning' },
  { label: t('task.tagColor.error'), value: 'error' },
]);

// ===== 创建 / 编辑弹窗 =====
const formOpen = ref(false);
const formSaving = ref(false);
const editTarget = ref<Task | null>(null);
type TaskStatus = 'Todo' | 'InProgress' | 'Review' | 'Completed';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

const form = ref<{
  title: string;
  description: string;
  projectId: number | undefined;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
}>({
  title: '',
  description: '',
  projectId: undefined,
  assigneeId: '',
  priority: 'Medium',
  status: 'Todo',
  deadline: '',
});

// 负责人候选列表：仅所选项目的成员（项目-成员联动）
const memberOptions = ref<{ label: string; value: string }[]>([]);

async function onFormProjectChange(value: AcceptableValue) {
  const projectId = value ? Number(value) : undefined;
  if (!projectId) {
    memberOptions.value = [];
    form.value.assigneeId = '';
    return;
  }
  const detail = await fetchProjectDetailRequest(projectId);
  const members = detail?.members ?? projectList.value.find((p) => p.id === projectId)?.members ?? [];
  memberOptions.value = members.map((m) => ({ label: m.nickName || m.userName, value: m.id }));
  // 切换项目后，若已选负责人不在新项目成员列表中则清空
  if (form.value.assigneeId && !members.some((m) => m.id === form.value.assigneeId)) {
    form.value.assigneeId = '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deadlineDate: any = ref(undefined);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deadlineTime: any = ref(undefined);
const popoverOpen = ref(false);
const batchStatusOpen = ref(false);

// ===== 标签选择与管理 =====
const selectedTagIds = ref<number[]>([]);
const tagManageOpen = ref(false);
const newTagName = ref('');
const newTagColor = ref('');
const editingTagId = ref<number | null>(null);
const editingTagName = ref('');
const editingTagColor = ref('');
const tagSaving = ref(false);

// ===== 任务详情抽屉（带评论区） =====
const detailOpen = ref(false);
const detailTask = ref<Task | null>(null);

function openDetail(task: Task) {
  detailTask.value = task;
  detailOpen.value = true;
}

function openCreate() {
  editTarget.value = null;
  // 若当前已按项目筛选，则新建时默认选中该项目
  const presetProjectId = projectFilter.value ? Number(projectFilter.value) : undefined;
  form.value = {
    title: '',
    description: '',
    projectId: presetProjectId,
    assigneeId: '',
    priority: 'Medium',
    status: 'Todo',
    deadline: '',
  };
  deadlineDate.value = undefined;
  deadlineTime.value = undefined;
  popoverOpen.value = false;
  selectedTagIds.value = [];
  onFormProjectChange(presetProjectId ?? '');
  formOpen.value = true;
}

function openEdit(task: Task) {
  editTarget.value = task;
  const deadline = task.deadline;
  const dateObj = parseDeadlineDate(deadline);
  form.value = {
    title: task.title,
    description: task.description || '',
    projectId: task.projectId,
    assigneeId: task.assigneeId || '',
    priority: task.priority,
    status: task.status,
    deadline: deadline || '',
  };
  if (dateObj) {
    deadlineDate.value = toCalendarDate(dateObj);
    deadlineTime.value = toTime(dateObj);
  } else {
    deadlineDate.value = undefined;
    deadlineTime.value = undefined;
  }
  selectedTagIds.value = (task.tags ?? []).map((t) => t.id);
  popoverOpen.value = false;
  onFormProjectChange(task.projectId);
  formOpen.value = true;
}

/** Parse a deadline string into a CalendarDateTime object, or undefined */
function parseDeadlineDate(raw: string | undefined | null): CalendarDateTime | undefined {
  if (!raw) return undefined;
  const isoStr = raw.includes('T') ? raw : raw.replace(' ', 'T');
  try {
    return parseDateTime(isoStr);
  } catch {
    return undefined;
  }
}

async function submitForm() {
  if (!form.value.title || formSaving.value) return;
  if (!form.value.projectId) {
    toast.add({
      title: t('task.toast.tip'),
      description: t('task.toast.selectProject'),
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  formSaving.value = true;
  let err: string | null = null;
  if (editTarget.value) {
    const r = await updateTaskRequest({
      id: editTarget.value.id,
      ...form.value,
      deadline: deadlineDate.value ? formatDate(deadlineDate.value) + 'T' + formatTime(deadlineTime.value) + ':00' : undefined,
      tagIds: selectedTagIds.value,
    });
    err = r.err;
  } else {
    const r = await createTaskRequest({
      ...form.value,
      deadline: deadlineDate.value ? formatDate(deadlineDate.value) + 'T' + formatTime(deadlineTime.value) + ':00' : undefined,
      tagIds: selectedTagIds.value,
    });
    err = r.err;
  }
  formSaving.value = false;
  if (err) {
    toast.add({
      title: t('task.toast.operationFailed'),
      description: err,
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  toast.add({
    title: editTarget.value ? t('task.toast.updateSuccess') : t('task.toast.createSuccess'),
    description: editTarget.value ? t('task.toast.taskUpdated') : t('task.toast.taskCreated'),
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
      title: t('task.toast.deleteFailed'),
      description: err,
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  toast.add({
    title: t('task.toast.deleteSuccess'),
    description: t('task.toast.taskDeleted'),
    icon: "i-material-symbols:check-circle-outline",
    color: "success",
  });
  deleteOpen.value = false;
  fetchCount();
  fetchList();
}

// ===== 状态 / 优先级标签 =====
const statusColor: Record<string, string> = {
  Todo: 'neutral',
  InProgress: 'info',
  Review: 'warning',
  Completed: 'success',
};
const statusLabel = computed<Record<string, string>>(() => ({
  Todo: t('task.status.todo'),
  InProgress: t('task.status.inProgress'),
  Review: t('task.status.review'),
  Completed: t('task.status.completed'),
}));

const priorityColor: Record<string, string> = {
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Urgent: 'error',
};
const priorityLabel = computed<Record<string, string>>(() => ({
  Low: t('task.priority.low'),
  Medium: t('task.priority.medium'),
  High: t('task.priority.high'),
  Urgent: t('task.priority.urgent'),
}));

function formatTime(d: any): string {
  if (!d) return '00:00';
  const pad = (n: number) => String(Math.floor(n || 0)).padStart(2, '0');
  return 'hour' in d ? pad(d.hour) + ':' + pad(d.minute) : '00:00';
}

function formatDate(d: any): string {
  if (!d) return '';
  const pad = (n: number) => String(Math.floor(n || 0)).padStart(2, '0');
  return d.year + '-' + pad(d.month) + '-' + pad(d.day);
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

const page = ref<number>(1);

const UIcon = resolveComponent('UIcon');
const UCheckbox = resolveComponent('UCheckbox');
const UBadge = resolveComponent('UBadge');
const viewMode = ref<'table' | 'kanban'>('table');
const kanbanTasks = ref<Task[]>([]);
const kanbanLoading = ref(false);

async function fetchAllTasks() {
  kanbanLoading.value = true;
  const data = await fetchTaskListRequest(projectFilter.value ? Number(projectFilter.value) : undefined);
  kanbanTasks.value = data || [];
  kanbanLoading.value = false;
}

function onProjectFilterChange() {
  applyFilter();
  if (viewMode.value === 'kanban') fetchAllTasks();
}

async function handleKanbanStatusChanged() {
  await fetchAllTasks();
  await fetchList(page.value);
  await fetchCount();
}

// ===== 标签管理 =====
function openTagManage() {
  newTagName.value = '';
  newTagColor.value = '';
  editingTagId.value = null;
  editingTagName.value = '';
  editingTagColor.value = '';
  tagManageOpen.value = true;
}

async function addTag() {
  const name = newTagName.value.trim();
  if (!name || tagSaving.value) return;
  tagSaving.value = true;
  const r = await createTagRequest({ name, color: newTagColor.value || undefined });
  tagSaving.value = false;
  if (r.err) {
    toast.add({ title: t('task.toast.createTagFailed'), description: r.err, icon: 'i-material-symbols:error-circle-rounded-outline-sharp', color: 'error' });
    return;
  }
  toast.add({ title: t('task.toast.createSuccess'), description: t('task.toast.tagCreated'), icon: 'i-material-symbols:check-circle-outline', color: 'success' });
  newTagName.value = '';
  newTagColor.value = '';
  fetchTags();
}

function startEditTag(tag: Tag) {
  editingTagId.value = tag.id;
  editingTagName.value = tag.name;
  editingTagColor.value = tag.color || '';
}

async function saveEditTag() {
  if (editingTagId.value === null || tagSaving.value) return;
  const name = editingTagName.value.trim();
  if (!name) {
    toast.add({ title: t('task.toast.updateTagFailed'), description: t('task.toast.tagNameRequired'), icon: 'i-material-symbols:error-circle-rounded-outline-sharp', color: 'error' });
    return;
  }
  tagSaving.value = true;
  const r = await updateTagRequest(editingTagId.value, { name, color: editingTagColor.value || undefined });
  tagSaving.value = false;
  if (r.err) {
    toast.add({ title: t('task.toast.updateTagFailed'), description: r.err, icon: 'i-material-symbols:error-circle-rounded-outline-sharp', color: 'error' });
    return;
  }
  toast.add({ title: t('task.toast.updateSuccess'), description: t('task.toast.tagUpdated'), icon: 'i-material-symbols:check-circle-outline', color: 'success' });
  editingTagId.value = null;
  fetchTags();
}

async function removeTag(id: number) {
  if (tagSaving.value) return;
  tagSaving.value = true;
  const err = await deleteTagRequest(id);
  tagSaving.value = false;
  if (err) {
    toast.add({ title: t('task.toast.deleteFailed'), description: err, icon: 'i-material-symbols:error-circle-rounded-outline-sharp', color: 'error' });
    return;
  }
  toast.add({ title: t('task.toast.deleteSuccess'), description: t('task.toast.tagDeleted'), icon: 'i-material-symbols:check-circle-outline', color: 'success' });
  if (editingTagId.value === id) editingTagId.value = null;
  fetchTags();
}


const columns = computed<TableColumn<Task>[]>(() => [
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
    header: t('task.table.title'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UBadge, {
          label: statusLabel.value[row.original.status] || row.original.status,
          color: statusColor[row.original.status] || 'neutral',
          variant: 'solid',
          size: 'xs',
        }),
        h('span', { class: 'font-medium' }, row.original.title),
      ]);
    },
  },
  {
    id: 'project',
    header: t('task.table.project'),
    cell: ({ row }) => {
      const name = row.original.projectName;
      if (!name) return h('span', { class: 'text-muted' }, '—');
      return h(UBadge, { label: name, color: 'primary', variant: 'soft', size: 'xs' });
    },
  },
  {
    id: 'assignee',
    header: t('task.table.assignee'),
    cell: ({ row }) => {
      const name = row.original.assigneeName || '—';
      return h('span', { class: row.original.assigneeName ? '' : 'text-muted' }, name);
    },
  },
  {
    id: 'priority',
    header: t('task.table.priority'),
    cell: ({ row }) => {
      return h(UBadge, {
        label: priorityLabel.value[row.original.priority] || row.original.priority,
        color: priorityColor[row.original.priority] || 'neutral',
        variant: 'soft',
        size: 'xs',
      });
    },
  },
  {
    id: 'tags',
    header: t('task.table.tags'),
    cell: ({ row }) => {
      const tags = row.original.tags ?? [];
      if (tags.length === 0) return h('span', { class: 'text-muted' }, '—');
      return h('div', { class: 'flex flex-wrap gap-1' },
        tags.map((tag) => h(UBadge, { label: tag.name, color: tag.color || 'neutral', variant: 'soft', size: 'xs' })));
    },
  },
  {
    accessorKey: 'deadline',
    header: t('task.table.deadline'),
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
    header: t('task.table.creator'),
    cell: ({ row }) =>
      h('span', { class: 'text-muted' }, row.original.creatorName || '—'),
  },
  {
    accessorKey: 'createdAt',
    header: t('task.table.createdAt'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-2' }, [
        h(UIcon, { class: 'size-5', name: 'i-meteor-icons:alarm-clock' }),
        h('span', row.getValue('createdAt')),
      ]);
    },
  },
  // Operations via template slot below (id: 'actions')
  {
    id: 'actions',
    header: t('task.table.actions'),
  },
]);
</script>

<template>
  <DashboardPanel :title="t('task.title')">
    <template v-if="can('task.read')">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <UInput class="max-w-sm" icon="i-lucide-search" :placeholder="t('task.filter.searchPlaceholder')" @update:model-value="filter" />
          <USelect
            v-model="projectFilter"
            :items="projectFilterOptions"
            :placeholder="t('task.filter.project')"
            class="w-40"
            @update:model-value="onProjectFilterChange"
          />
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            :placeholder="t('task.filter.status')"
            class="w-32"
            @update:model-value="applyFilter()"
          />
          <USelect
            v-model="priorityFilter"
            :items="priorityOptions"
            :placeholder="t('task.filter.priority')"
            class="w-32"
            @update:model-value="applyFilter()"
          />
          <USelect
            v-model="tagFilter"
            :items="tagOptions"
            :placeholder="t('task.filter.tag')"
            class="w-32"
            @update:model-value="applyFilter()"
          />
          <div class="inline-flex rounded-md border border-default overflow-hidden ml-2">
            <button type="button" :class="viewMode === 'table' ? 'bg-primary text-white' : ''" class="px-4 py-2 text-sm transition-colors" @click="viewMode = 'table'">{{ t('task.view.table') }}</button>
            <button type="button" :class="viewMode === 'kanban' ? 'bg-primary text-white' : ''" class="px-4 py-2 text-sm transition-colors" @click="viewMode = 'kanban'; fetchAllTasks()">{{ t('task.view.kanban') }}</button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <UButton v-if="canCreateTask" :label="t('task.action.create')" icon="i-lucide-plus" @click="openCreate" />
          <UButton v-if="can('tag.create')" :label="t('task.action.manageTags')" icon="i-lucide-tag" variant="outline" @click="openTagManage" />
          <UPopover v-if="(can('task.update') || managedProjectIds.length > 0) && viewMode === 'table'" v-model:open="batchStatusOpen">
            <UButton variant="outline" :label="t('task.action.batchStatus')" icon="i-lucide-list-checks" />
            <template #content>
              <div class="flex flex-col gap-1 p-2">
                <UButton
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  variant="ghost"
                  :label="opt.label"
                  class="justify-start"
                  @click="batchUpdateStatus(opt.value); batchStatusOpen = false"
                />
              </div>
            </template>
          </UPopover>
          <UButton v-if="can('task.delete') || managedProjectIds.length > 0" :label="t('task.action.delete')" color="error" variant="subtle" icon="i-lucide-trash"  @click="open = true" />
          <UModal :title="t('task.deleteModal.batchTitle', { count: table?.tableApi.getSelectedRowModel().rows.length ?? 0 })" v-model:open="open">
            <template #body>
              {{ t('task.deleteModal.batchConfirm') }}
              <div class="flex justify-end gap-2">
                <UButton :label="t('task.action.cancel')" color="neutral" variant="subtle" @click="open = false" />
                <UButton :label="t('task.action.confirm')" color="error" variant="solid" loading-auto @click="deleteBatch" />
              </div>
            </template>
          </UModal>
        </div>
      </div>

      <div v-if="viewMode === 'table'" class="flex-1 flex flex-col">
      <UTable
        ref="table"
        :loading="loading"
        loading-color="primary"
        loading-animation="carousel"
        :data="taskList"
        :columns="columns"
        class="flex-1"
      >
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              size="xs"
              variant="ghost"
              :label="t('task.action.detail')"
              icon="i-lucide-eye"
              @click="openDetail(row.original)"
            />
            <UButton
              v-if="canEditTask(row.original)"
              size="xs"
              variant="ghost"
              :label="t('task.action.edit')"
              @click="openEdit(row.original)"
            />
            <UButton
              v-if="canDeleteTask(row.original)"
              size="xs"
              variant="ghost"
              color="error"
              :label="t('task.action.delete')"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted" />
        <div class="flex items-center gap-1.5">
          <UPagination v-model:page="page" :total="taskCount" show-edges size="lg" @update:page="updatePage" />
        </div>
      </div>

      </div>

      <div v-if="viewMode === 'kanban'" class="flex-1">
        <div v-if="kanbanLoading" class="flex items-center justify-center py-16 text-muted">{{ t('task.loading') }}</div>
        <TaskKanban v-else :tasks="kanbanTasks" :canUpdate="can('task.update')" :canDelete="can('task.delete')" :managedProjectIds="managedProjectIds" @edit="openEdit" @delete="confirmDelete" @detail="openDetail" @statusChanged="handleKanbanStatusChanged" />
      </div>

      <!-- 新建 / 编辑任务 -->
      <UModal v-model:open="formOpen" :title="editTarget ? t('task.form.editTitle') : t('task.form.createTitle')" size="xl">
        <template #body>
          <div class="flex flex-col gap-3">
            <UFormField :label="t('task.form.title')" required>
              <UInput v-model="form.title" :placeholder="t('task.form.titlePlaceholder')" class="w-full" />
            </UFormField>
            <UFormField :label="t('task.form.description')">
              <UTextarea v-model="form.description" :placeholder="t('task.form.descriptionPlaceholder')" class="w-full" :rows="3" />
            </UFormField>
            <UFormField :label="t('task.form.project')" required>
              <USelect
                v-model="form.projectId"
                :items="formProjectOptions"
                :placeholder="t('task.form.projectPlaceholder')"
                class="w-full"
                @update:model-value="onFormProjectChange"
              />
            </UFormField>
            <UFormField :label="t('task.form.assignee')">
              <USelect
                v-model="form.assigneeId"
                :items="memberOptions"
                :placeholder="form.projectId ? t('task.form.assigneePlaceholder') : t('task.form.assigneeNoProject')"
                :disabled="!form.projectId"
                class="w-full"
              />
            </UFormField>
            <div class="flex gap-3">
              <UFormField :label="t('task.form.priority')" class="flex-1">
                <USelect
                  v-model="form.priority"
                  :items="priorityOptions"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField :label="t('task.form.tags')">
              <div v-if="tagList.length === 0" class="text-sm text-muted">
                {{ t('task.form.noTagsHint') }}
              </div>
              <div v-else class="flex flex-col gap-1 max-h-40 overflow-auto rounded-md border border-default p-2">
                <UCheckbox
                  v-for="tag in tagList"
                  :key="tag.id"
                  :model-value="selectedTagIds.includes(tag.id)"
                  :label="tag.name"
                  @update:model-value="(v: boolean | 'indeterminate') => v ? selectedTagIds.includes(tag.id) || selectedTagIds.push(tag.id) : selectedTagIds = selectedTagIds.filter(id => id !== tag.id)"
                />
              </div>
            </UFormField>
            <div class="flex gap-3">
              <UFormField :label="t('task.form.deadline')">
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
              <UFormField :label="t('task.form.time')" class="w-28">
                <UInputTime v-model="deadlineTime" />
              </UFormField>
            </div>
            <UFormField v-if="editTarget" :label="t('task.form.status')">
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
            <UButton :label="t('task.action.cancel')" color="neutral" variant="subtle" @click="formOpen = false" />
            <UButton :label="t('task.action.save')" color="primary" :loading="formSaving" @click="submitForm" />
          </div>
        </template>
      </UModal>

      <!-- 删除确认 -->
      <UModal v-model:open="deleteOpen" :title="t('task.deleteModal.title')">
        <template #body>
          {{ t('task.deleteModal.confirm', { title: deleteTarget?.title ?? '' }) }}
          <div class="flex justify-end gap-2 mt-4">
            <UButton :label="t('task.action.cancel')" color="neutral" variant="subtle" @click="deleteOpen = false" />
            <UButton :label="t('task.action.confirm')" color="error" variant="solid" @click="doDelete" />
          </div>
        </template>
      </UModal>

      <!-- 管理标签 -->
      <UModal v-model:open="tagManageOpen" :title="t('task.tagManage.title')" size="md">
        <template #body>
          <div class="flex flex-col gap-3">
            <div v-if="tagList.length === 0" class="text-sm text-muted">{{ t('task.tagManage.empty') }}</div>
            <div class="flex flex-col gap-2 max-h-64 overflow-auto">
              <div v-for="tag in tagList" :key="tag.id" class="flex items-center gap-2">
                <template v-if="editingTagId === tag.id">
                  <UInput v-model="editingTagName" class="flex-1" :placeholder="t('task.tagManage.namePlaceholder')" />
                  <USelect :model-value="editingTagColor || 'default'" :items="tagColorOptions" class="w-28" @update:model-value="editingTagColor = $event === 'default' ? '' : String($event ?? '')" />
                  <UButton size="xs" color="primary" icon="i-lucide-check" :aria-label="t('task.tagManage.saveAria')" @click="saveEditTag" />
                  <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" :aria-label="t('task.tagManage.cancelAria')" @click="editingTagId = null" />
                </template>
                <template v-else>
                  <UBadge :label="tag.name" :color="tag.color || 'neutral'" variant="soft" size="sm" />
                  <div class="flex-1" />
                  <UButton v-if="can('tag.update')" size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" :aria-label="t('task.tagManage.renameAria')" @click="startEditTag(tag)" />
                  <UButton v-if="can('tag.delete')" size="xs" variant="ghost" color="error" icon="i-lucide-trash" :aria-label="t('task.tagManage.deleteAria')" @click="removeTag(tag.id)" />
                </template>
              </div>
            </div>
            <USeparator />
            <div v-if="can('tag.create')" class="flex items-center gap-2">
              <UInput v-model="newTagName" class="flex-1" :placeholder="t('task.tagManage.newPlaceholder')" />
              <USelect :model-value="newTagColor || 'default'" :items="tagColorOptions" class="w-28" @update:model-value="newTagColor = $event === 'default' ? '' : String($event ?? '')" />
              <UButton size="sm" color="primary" :label="t('task.action.add')" :loading="tagSaving" @click="addTag" />
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton :label="t('task.action.close')" color="neutral" variant="subtle" @click="tagManageOpen = false" />
          </div>
        </template>
      </UModal>

      <!-- 任务详情抽屉（带评论区） -->
      <TaskDetailDrawer v-model:open="detailOpen" :task="detailTask" />
    </template>

    <template v-else>
      <div class="flex flex-col items-center justify-center py-16 text-muted">
        <UIcon name="i-lucide-shield-x" class="size-12 mb-4 opacity-40" />
        <p class="text-lg">{{ t('task.noPermission') }}</p>
      </div>
    </template>
  </DashboardPanel>
</template>

<style scoped></style>
