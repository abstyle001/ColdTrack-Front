<script setup lang="ts">
import { computed, h, ref, resolveComponent } from "vue";
import { useRouter } from "vue-router";
import { parseDateTime, toCalendarDate } from "@internationalized/date";
import type { Project, User } from "../utils/types";
import type { TableColumn, AcceptableValue } from "@nuxt/ui";
import { useProject } from "../logic/useProject";
import { usePermission } from "../logic/usePermission";
import { useUserStore } from "../store";
import { fetchUserListRequest, fetchProjectDetailRequest } from "../api/userApi";

const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");

const { can } = usePermission();
const userStore = useUserStore();
const router = useRouter();
const toast = useToast();

const {
  filteredProjects,
  loading,
  keyword,
  statusFilter,
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} = useProject();

const statusLabel: Record<string, string> = {
  InProgress: "进行中",
  Completed: "已完结",
  Archived: "已归档",
};
const statusColor: Record<string, string> = {
  InProgress: "info",
  Completed: "success",
  Archived: "neutral",
};

// Reka UI 的 SelectItem 不允许空字符串 value（会直接抛错并锁死页面点击），
// 因此「全部状态」用哨兵值 "all"，变更时映射回空字符串
const statusFilterOptions = [
  { label: "全部状态", value: "all" },
  { label: "进行中", value: "InProgress" },
  { label: "已完结", value: "Completed" },
  { label: "已归档", value: "Archived" },
];

function onStatusFilterChange(value: AcceptableValue) {
  statusFilter.value = !value || value === "all" ? "" : String(value);
  fetchProjects();
}

const statusOptions = [
  { label: "进行中", value: "InProgress" },
  { label: "已完结", value: "Completed" },
  { label: "已归档", value: "Archived" },
];

// 负责人 / 成员候选人员
const userList = ref<User[]>([]);
const userOptions = computed(() =>
  userList.value.map((u) => ({ label: u.nickName || u.userName, value: u.id }))
);

async function loadUsers() {
  const data = await fetchUserListRequest();
  if (data) userList.value = data;
}

// ===== 新建 / 编辑弹窗 =====
type ProjectStatus = "InProgress" | "Completed" | "Archived";

const open = ref(false);
const saving = ref(false);
const editing = ref<Project | null>(null);
const form = ref<{
  name: string;
  description: string;
  managerId: string;
  status: ProjectStatus;
}>({
  name: "",
  description: "",
  managerId: "",
  status: "InProgress",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const startDateVal: any = ref(undefined);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const endDateVal: any = ref(undefined);
const selectedMemberIds = ref<string[]>([]);

function parseDate(raw: string | null | undefined) {
  if (!raw) return undefined;
  const isoStr = raw.includes("T") ? raw : raw.replace(" ", "T");
  try {
    return toCalendarDate(parseDateTime(isoStr));
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDate(d: any): string {
  if (!d) return "";
  const pad = (n: number) => String(Math.floor(n || 0)).padStart(2, "0");
  return d.year + "-" + pad(d.month) + "-" + pad(d.day);
}

function openCreate() {
  editing.value = null;
  form.value = { name: "", description: "", managerId: "", status: "InProgress" };
  startDateVal.value = undefined;
  endDateVal.value = undefined;
  selectedMemberIds.value = [];
  open.value = true;
}

async function openEdit(project: Project) {
  editing.value = project;
  form.value = {
    name: project.name,
    description: project.description ?? "",
    managerId: project.managerId ?? "",
    status: project.status,
  };
  startDateVal.value = parseDate(project.startDate);
  endDateVal.value = parseDate(project.endDate);
  let members = project.members ?? [];
  if (members.length === 0 && project.memberCount > 0) {
    const detail = await fetchProjectDetailRequest(project.id);
    members = detail?.members ?? [];
  }
  selectedMemberIds.value = members.map((m) => m.id);
  open.value = true;
}

async function submit() {
  if (saving.value) return;
  if (!form.value.name.trim() || !form.value.managerId) {
    toast.add({
      title: "提示",
      description: "请填写项目名称并选择负责人",
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  saving.value = true;
  const payload = {
    name: form.value.name.trim(),
    description: form.value.description || undefined,
    managerId: form.value.managerId,
    status: form.value.status,
    // 后端 System.Text.Json 只认 ISO 8601，日期与时间之间必须是 "T"
    startDate: startDateVal.value ? formatDate(startDateVal.value) + "T00:00:00" : undefined,
    endDate: endDateVal.value ? formatDate(endDateVal.value) + "T00:00:00" : undefined,
    memberIds: selectedMemberIds.value,
  };
  const result = editing.value
    ? await updateProject(editing.value.id, payload)
    : await createProject(payload);
  saving.value = false;
  if (result) open.value = false;
}

// ===== 删除确认 =====
const deleteOpen = ref(false);
const deleteTarget = ref<Project | null>(null);

function openDelete(project: Project) {
  deleteTarget.value = project;
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  const ok = await deleteProject(deleteTarget.value.id);
  if (ok) deleteOpen.value = false;
}

function isManager(project: Project) {
  return !!project.managerId && project.managerId === userStore.user.id;
}

function viewTasks(project: Project) {
  router.push("/task?projectId=" + project.id);
}

const columns: TableColumn<Project>[] = [
  {
    accessorKey: "name",
    header: "项目名称",
    cell: ({ row }) =>
      h("div", { class: "flex flex-col min-w-0" }, [
        h("span", { class: "font-medium" }, row.original.name),
        row.original.description
          ? h("span", { class: "text-xs text-muted truncate max-w-72" }, row.original.description)
          : null,
      ]),
  },
  {
    accessorKey: "managerName",
    header: "负责人",
    cell: ({ row }) =>
      h(
        "span",
        { class: row.original.managerName ? "" : "text-muted" },
        row.original.managerName || "—"
      ),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) =>
      h(UBadge, {
        label: statusLabel[row.original.status] || row.original.status,
        color: statusColor[row.original.status] || "neutral",
        variant: "soft",
        size: "xs",
      }),
  },
  {
    id: "dateRange",
    header: "起止日期",
    cell: ({ row }) => {
      const s = row.original.startDate?.slice(0, 10);
      const e = row.original.endDate?.slice(0, 10);
      if (!s && !e) return h("span", { class: "text-muted" }, "—");
      return h("div", { class: "flex items-center gap-1" }, [
        h(UIcon, { class: "size-4 text-muted", name: "i-lucide-calendar" }),
        h("span", `${s ?? "—"} ~ ${e ?? "—"}`),
      ]);
    },
  },
  { accessorKey: "memberCount", header: "成员数" },
  { accessorKey: "taskCount", header: "任务数" },
  { accessorKey: "createdAt", header: "创建时间" },
  {
    id: "actions",
    header: "操作",
  },
];

loadUsers();
</script>

<template>
  <DashboardPanel title="项目">
    <template v-if="can('project.read')">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="keyword"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="搜索项目名称或描述"
          />
          <USelect
            :model-value="statusFilter || 'all'"
            :items="statusFilterOptions"
            placeholder="按状态筛选"
            class="w-32"
            @update:model-value="onStatusFilterChange"
          />
        </div>
        <UButton v-if="can('project.create')" label="新建项目" icon="i-lucide-plus" @click="openCreate" />
      </div>

      <UTable
        v-if="loading || filteredProjects.length > 0"
        :loading="loading"
        loading-color="primary"
        loading-animation="carousel"
        :data="filteredProjects"
        :columns="columns"
        class="flex-1 mt-3"
      >
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              size="xs"
              variant="ghost"
              label="查看任务"
              icon="i-lucide-list-todo"
              @click="viewTasks(row.original)"
            />
            <UButton
              v-if="can('project.update') || isManager(row.original)"
              size="xs"
              variant="ghost"
              label="编辑"
              @click="openEdit(row.original)"
            />
            <UButton
              v-if="can('project.delete') || isManager(row.original)"
              size="xs"
              variant="ghost"
              color="error"
              label="删除"
              @click="openDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div v-else class="flex flex-1 flex-col items-center justify-center py-16 text-muted">
        <UIcon name="i-lucide-folder-open" class="size-12 mb-3 opacity-40" />
        <p>暂无项目</p>
        <p v-if="can('project.create')" class="text-sm mt-1">点击右上角「新建项目」创建第一个项目</p>
      </div>

      <!-- 新建 / 编辑项目 -->
      <UModal v-model:open="open" :title="editing ? '编辑项目' : '新建项目'" size="lg">
        <template #body>
          <div class="flex flex-col gap-3">
            <UFormField label="项目名称" required>
              <UInput v-model="form.name" placeholder="请输入项目名称" class="w-full" />
            </UFormField>
            <UFormField label="项目描述">
              <UTextarea v-model="form.description" placeholder="项目描述（可选）" class="w-full" :rows="3" />
            </UFormField>
            <UFormField label="负责人" required>
              <USelect
                v-model="form.managerId"
                :items="userOptions"
                placeholder="选择负责人"
                class="w-full"
              />
            </UFormField>
            <UFormField label="状态">
              <USelect
                v-model="form.status"
                :items="statusOptions"
                class="w-full"
              />
            </UFormField>
            <div class="flex gap-3">
              <UFormField label="开始日期" class="flex-1">
                <UInputDate v-model="startDateVal" class="w-full" />
              </UFormField>
              <UFormField label="结束日期" class="flex-1">
                <UInputDate v-model="endDateVal" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="项目成员">
              <USelect
                v-model="selectedMemberIds"
                :items="userOptions"
                multiple
                placeholder="选择项目成员"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="取消" color="neutral" variant="subtle" @click="open = false" />
            <UButton label="保存" color="primary" :loading="saving" @click="submit" />
          </div>
        </template>
      </UModal>

      <!-- 删除确认 -->
      <UModal v-model:open="deleteOpen" :title="`删除项目「${deleteTarget?.name}」`">
        <template #body>
          确定要删除该项目吗？此操作无法撤销；若项目下仍有任务，将无法删除。
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="取消" color="neutral" variant="subtle" @click="deleteOpen = false" />
            <UButton label="确定删除" color="error" @click="confirmDelete" />
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
