<script setup lang="ts">
import { h, ref, resolveComponent } from "vue";
import type { Department, User } from "../utils/types";
import { useDepartment } from "../logic/useDepartment";
import { fetchUserListRequest } from "../api/userApi";
import type { TableColumn } from "@nuxt/ui";

const {
  departmentList,
  loading,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = useDepartment();


const userList = ref<User[]>([]);
const users = ref<{ label: string; value: string }[]>([]);
const parentOptions = ref<{ label: string; value: string }[]>([]);

const open = ref(false);
const editing = ref<Department | null>(null);
const form = ref<Partial<Department>>({
  name: "",
  parentId: "",
  managerId: "",
  workspace: "",
  explain: "",
  addition: "",
});

const deleteOpen = ref(false);
const deleteTarget = ref<Department | null>(null);

const positionsOpen = ref(false);
const positionsFor = ref<Department | null>(null);
const positionsLoading = ref(false);
const positionNames = ref<string[]>([]);

async function loadUsers() {
  const data = await fetchUserListRequest();
  if (data) {
    userList.value = data;
    users.value = data.map((u) => ({
      label: u.nickName || u.userName,
      value: u.id,
    }));
  }
}

function refreshParentOptions() {
  parentOptions.value = departmentList.value.map((d) => ({
    label: `${"　".repeat(Math.max(0, d.level - 1))}${d.name}`,
    value: d.id,
  }));
}

function openCreate() {
  editing.value = null;
  form.value = {
    name: "",
    parentId: "",
    managerId: "",
    workspace: "",
    explain: "",
    addition: "",
  };
  refreshParentOptions();
  open.value = true;
}

function openEdit(dept: Department) {
  editing.value = dept;
  form.value = {
    id: dept.id,
    name: dept.name,
    parentId: dept.parentId,
    managerId: dept.managerId,
    workspace: dept.workspace,
    explain: dept.explain,
    addition: dept.addition,
  };
  refreshParentOptions();
  open.value = true;
}

async function submit() {
  if (!form.value.name) return;
  if (editing.value) {
    await updateDepartment(form.value);
  } else {
    await createDepartment(form.value);
  }
  open.value = false;
}

function openDelete(dept: Department) {
  deleteTarget.value = dept;
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (deleteTarget.value) {
    await deleteDepartment(deleteTarget.value.id);
  }
  deleteOpen.value = false;
}

async function openPositions(dept: Department) {
  positionsFor.value = dept;
  positionsOpen.value = true;
  positionsLoading.value = true;
  const { fetchPositionsByDepartmentRequest } = await import("../api/userApi");
  const data = await fetchPositionsByDepartmentRequest(dept.id);
  positionNames.value = data ? data.map((p) => p.name) : [];
  positionsLoading.value = false;
}

function managerName(id: string) {
  return users.value.find((u) => u.value === id)?.label ?? "—";
}

const columns: TableColumn<Department>[] = [
  {
    accessorKey: "name",
    header: "部门名称",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "text-muted" }, "　".repeat(Math.max(0, row.original.level - 1))),
        h("span", { class: "font-medium" }, row.original.name),
      ]),
  },
  {
    accessorKey: "managerName",
    header: "负责人",
    cell: ({ row }) => managerName(row.original.managerId),
  },
  {
    accessorKey: "workspace",
    header: "工作地",
  },
  {
    accessorKey: "explain",
    header: "说明",
    cell: ({ row }) => h("span", { class: "text-muted truncate" }, row.original.explain),
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const UButton = resolveComponent("UButton");
      return h("div", { class: "flex gap-1" }, [
        h(UButton, {
          size: "xs",
          variant: "ghost",
          label: "职位",
          onClick: () => openPositions(row.original),
        }),
        h(UButton, {
          size: "xs",
          variant: "ghost",
          label: "编辑",
          onClick: () => openEdit(row.original),
        }),
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

loadUsers();
</script>

<template>
  <DashboardPanel title="部门">
    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <UButton label="新建部门" icon="i-lucide-plus" @click="openCreate" />
    </div>

    <UTable
      :loading="loading"
      loading-color="primary"
      loading-animation="carousel"
      :data="departmentList"
      :columns="columns"
      class="flex-1 mt-3"
    />

    <!-- 新建/编辑 -->
    <UModal v-model:open="open" :title="editing ? '编辑部门' : '新建部门'">
      <template #body>
        <div class="flex flex-col gap-3">
          <UFormField label="部门名称">
            <UInput v-model="form.name" placeholder="请输入部门名称" class="w-full" />
          </UFormField>
          <UFormField label="父部门">
            <USelect
              v-model="form.parentId"
              :items="parentOptions"
              placeholder="一级部门（无父级）"
              class="w-full"
            />
          </UFormField>
          <UFormField label="负责人">
            <USelect
              v-model="form.managerId"
              :items="users"
              placeholder="选择负责人"
              class="w-full"
            />
          </UFormField>
          <UFormField label="工作地点">
            <UInput v-model="form.workspace" placeholder="工作地点" class="w-full" />
          </UFormField>
          <UFormField label="部门说明">
            <UTextarea v-model="form.explain" placeholder="部门说明" class="w-full" />
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

    <!-- 删除确认 -->
    <UModal v-model:open="deleteOpen" :title="`删除部门「${deleteTarget?.name}」`">
      <template #body>
        确定要删除该部门及其所有子部门吗？此操作不可撤销。
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="取消" color="neutral" variant="subtle" @click="deleteOpen = false" />
          <UButton label="确定删除" color="error" @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- 部门职位 -->
    <UModal v-model:open="positionsOpen" :title="`部门「${positionsFor?.name}」的职位`">
      <template #body>
        <div v-if="positionsLoading" class="text-muted">加载中…</div>
        <div v-else-if="positionNames.length === 0" class="text-muted">暂无关联职位</div>
        <ul v-else class="flex flex-col gap-1">
          <li v-for="name in positionNames" :key="name" class="rounded bg-elevated px-3 py-2">
            {{ name }}
          </li>
        </ul>
      </template>
    </UModal>
  </DashboardPanel>
</template>

<style scoped></style>
