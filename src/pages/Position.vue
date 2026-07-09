<script setup lang="ts">
import { h, ref, resolveComponent } from "vue";
import type { Department, Position } from "../utils/types";
import { usePosition } from "../logic/usePosition";
import {
  fetchDepartmentListRequest,
  fetchDepartmentsByPositionRequest,
  assignPositionDepartmentRequest,
  removePositionDepartmentRequest,
  fetchUsersByPositionRequest,
} from "../api/userApi";
import type { TableColumn } from "@nuxt/ui";

const {
  positionList,
  loading,
  createPosition,
  updatePosition,
  deletePosition,
} = usePosition();

const allDepartments = ref<Department[]>([]);
const deptOptions = ref<{ label: string; value: string }[]>([]);

const open = ref(false);
const editing = ref<Position | null>(null);
const form = ref<Partial<Position>>({
  name: "",
  duty: "",
  workspace: "",
  addition: "",
});

const deleteOpen = ref(false);
const deleteTarget = ref<Position | null>(null);

const assignOpen = ref(false);
const assignTarget = ref<Position | null>(null);
const selectedDeptIds = ref<string[]>([]);
const currentDeptIds = ref<string[]>([]);

const membersOpen = ref(false);
const membersFor = ref<Position | null>(null);
const membersLoading = ref(false);
const memberNames = ref<string[]>([]);

async function loadDepartments() {
  const data = await fetchDepartmentListRequest();
  if (data) {
    allDepartments.value = data;
    deptOptions.value = data.map((d) => ({ label: d.name, value: d.id }));
  }
}

function openCreate() {
  editing.value = null;
  form.value = { name: "", duty: "", workspace: "", addition: "" };
  open.value = true;
}

function openEdit(position: Position) {
  editing.value = position;
  form.value = {
    id: position.id,
    name: position.name,
    duty: position.duty,
    workspace: position.workspace,
    addition: position.addition,
  };
  open.value = true;
}

async function submit() {
  if (!form.value.name) return;
  if (editing.value) await updatePosition(form.value);
  else await createPosition(form.value);
  open.value = false;
}

function openDelete(position: Position) {
  deleteTarget.value = position;
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (deleteTarget.value) await deletePosition(deleteTarget.value.id);
  deleteOpen.value = false;
}

async function openAssign(position: Position) {
  assignTarget.value = position;
  const data = await fetchDepartmentsByPositionRequest(position.id);
  currentDeptIds.value = data ? data.map((d) => d.id) : [];
  selectedDeptIds.value = [...currentDeptIds.value];
  assignOpen.value = true;
}

async function saveAssign() {
  if (!assignTarget.value) return;
  const pid = assignTarget.value.id;
  for (const d of allDepartments.value) {
    const isSelected = selectedDeptIds.value.includes(d.id);
    const isCurrent = currentDeptIds.value.includes(d.id);
    if (isSelected && !isCurrent) {
      await assignPositionDepartmentRequest(pid, d.id);
    } else if (!isSelected && isCurrent) {
      await removePositionDepartmentRequest(pid, d.id);
    }
  }
  assignOpen.value = false;
}

async function openMembers(position: Position) {
  membersFor.value = position;
  membersOpen.value = true;
  membersLoading.value = true;
  const data = await fetchUsersByPositionRequest(position.id);
  memberNames.value = data ? data.map((u) => u.nickName || u.userName) : [];
  membersLoading.value = false;
}

const columns: TableColumn<Position>[] = [
  { accessorKey: "name", header: "职位名称" },
  { accessorKey: "duty", header: "职责", cell: ({ row }) => h("span", { class: "text-muted truncate" }, row.original.duty) },
  { accessorKey: "workspace", header: "工作地" },
  { accessorKey: "createdAt", header: "创建时间" },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const UButton = resolveComponent("UButton");
      return h("div", { class: "flex gap-1" }, [
        h(UButton, { size: "xs", variant: "ghost", label: "部门", onClick: () => openAssign(row.original) }),
        h(UButton, { size: "xs", variant: "ghost", label: "成员", onClick: () => openMembers(row.original) }),
        h(UButton, { size: "xs", variant: "ghost", label: "编辑", onClick: () => openEdit(row.original) }),
        h(UButton, {
          size: "xs",
          variant: "ghost",
          color: "error",
          label: "删除",
          onClick: () => openDelete(row.original),
        }),
      ]);
    },
  },
];

loadDepartments();
</script>

<template>
  <DashboardPanel title="职位">
    <div class="flex flex-wrap items-center justify-end gap-1.5">
      <UButton label="新建职位" icon="i-lucide-plus" @click="openCreate" />
    </div>

    <UTable
      :loading="loading"
      loading-color="primary"
      loading-animation="carousel"
      :data="positionList"
      :columns="columns"
      class="flex-1 mt-3"
    />

    <!-- 新建/编辑 -->
    <UModal v-model:open="open" :title="editing ? '编辑职位' : '新建职位'">
      <template #body>
        <div class="flex flex-col gap-3">
          <UFormField label="职位名称">
            <UInput v-model="form.name" placeholder="请输入职位名称" class="w-full" />
          </UFormField>
          <UFormField label="主要职责">
            <UTextarea v-model="form.duty" placeholder="主要职责" class="w-full" />
          </UFormField>
          <UFormField label="工作地点">
            <UInput v-model="form.workspace" placeholder="工作地点" class="w-full" />
          </UFormField>
          <UFormField label="附加信息">
            <UInput v-model="form.addition" placeholder="附加信息" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="取消" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="保存" color="primary" @click="submit" />
        </div>
      </template>
    </UModal>

    <!-- 分配部门 -->
    <UModal v-model:open="assignOpen" :title="`为「${assignTarget?.name}」分配部门`">
      <template #body>
        <div v-if="deptOptions.length === 0" class="text-muted">暂无部门</div>
        <div class="flex flex-col gap-1 max-h-80 overflow-auto">
          <UCheckbox
            v-for="opt in deptOptions"
            :key="opt.value"
            :model-value="selectedDeptIds.includes(opt.value)"
            :label="opt.label"
            @update:model-value="(v: boolean | 'indeterminate') => v ? selectedDeptIds.push(opt.value) : selectedDeptIds = selectedDeptIds.filter(id => id !== opt.value)"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="取消" color="neutral" variant="subtle" @click="assignOpen = false" />
          <UButton label="保存" color="primary" @click="saveAssign" />
        </div>
      </template>
    </UModal>

    <!-- 删除确认 -->
    <UModal v-model:open="deleteOpen" :title="`删除职位「${deleteTarget?.name}」`">
      <template #body>
        确定要删除该职位吗？相关职位-部门、用户-职位关联将被一并清理。
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="取消" color="neutral" variant="subtle" @click="deleteOpen = false" />
          <UButton label="确定删除" color="error" @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- 成员 -->
    <UModal v-model:open="membersOpen" :title="`职位「${membersFor?.name}」的成员`">
      <template #body>
        <div v-if="membersLoading" class="text-muted">加载中…</div>
        <div v-else-if="memberNames.length === 0" class="text-muted">暂无成员</div>
        <ul v-else class="flex flex-col gap-1">
          <li v-for="name in memberNames" :key="name" class="rounded bg-elevated px-3 py-2">
            {{ name }}
          </li>
        </ul>
      </template>
    </UModal>
  </DashboardPanel>
</template>

<style scoped></style>
