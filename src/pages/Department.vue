<script setup lang="ts">
import { computed, h, ref, resolveComponent, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { Department, User } from "../utils/types";
import { useDepartment } from "../logic/useDepartment";
import { usePermission } from "../logic/usePermission";
import { fetchUserListRequest } from "../api/userApi";
import type { TableColumn } from "@nuxt/ui";

const UButton = resolveComponent("UButton");
const { can } = usePermission();
const { t } = useI18n();

const {
  departmentList,
  allDepartments,
  loading,
  page,
  pageSize,
  departmentCount,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = useDepartment();

// 由扁平列表在客户端构建部门树（后端 /department/tree 对顶级部门处理有误）
const treeData = ref<Department[]>([]);

function buildTree(list: Department[]): Department[] {
  const map = new Map<string, Department>();
  list.forEach((d) => map.set(d.id, { ...d, children: [] }));
  const roots: Department[] = [];
  map.forEach((node) => {
    const pid = node.parentId;
    if (pid && pid !== node.id && map.has(pid)) {
      map.get(pid)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// 折叠状态：已展开（显示其子部门）的部门 id
const expandedIds = ref<Set<string>>(new Set());

// 根据折叠状态展开为可见的扁平列表（含 depth，用于缩进）
const visibleRows = computed<Department[]>(() => {
  const out: Department[] = [];
  const walk = (nodes: Department[], depth: number) => {
    for (const n of nodes) {
      out.push({ ...n, depth });
      if (expandedIds.value.has(n.id) && n.children && n.children.length) {
        walk(n.children, depth + 1);
      }
    }
  };
  walk(treeData.value, 0);
  return out;
});

function toggleExpand(id: string) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedIds.value = next;
}

watch(
  departmentList,
  (list) => {
    const tree = buildTree(list);
    treeData.value = tree;
    // 默认展开一级部门
    expandedIds.value = new Set(tree.map((d) => d.id));
  },
  { immediate: true }
);


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
  parentOptions.value = allDepartments.value.map((d) => ({
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

const columns = computed<TableColumn<Department>[]>(() => [
  {
    accessorKey: "name",
    header: t("department.table.name"),
    cell: ({ row }) => {
      const dept = row.original;
      const hasChildren = !!(dept.children && dept.children.length);
      const depth = dept.depth ?? 0;
      return h(
        "div",
        { class: "flex items-center gap-1", style: { paddingLeft: `${depth * 16}px` } },
        [
          hasChildren
            ? h(UButton, {
                size: "xs",
                variant: "ghost",
                square: true,
                color: "neutral",
                icon: expandedIds.value.has(dept.id)
                  ? "i-lucide-chevron-down"
                  : "i-lucide-chevron-right",
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  toggleExpand(dept.id);
                },
              })
            : h("span", { class: "w-6" }),
          h("span", { class: "font-medium" }, dept.name),
        ]
      );
    },
  },
  {
    accessorKey: "managerName",
    header: t("department.table.manager"),
    cell: ({ row }) => managerName(row.original.managerId),
  },
  {
    accessorKey: "workspace",
    header: t("department.table.workspace"),
  },
  {
    accessorKey: "explain",
    header: t("department.table.explain"),
    cell: ({ row }) => h("span", { class: "text-muted truncate" }, row.original.explain),
  },
  {
    accessorKey: "createdAt",
    header: t("department.table.createdAt"),
  },
  {
    id: "actions",
    header: t("department.table.actions"),
    cell: ({ row }) => {
      const buttons: any[] = [];
      if (can("position.read")) {
        buttons.push(
          h(UButton, {
            size: "xs",
            variant: "ghost",
            label: t("department.table.positions"),
            onClick: () => openPositions(row.original),
          })
        );
      }
      if (can("department.update")) {
        buttons.push(
          h(UButton, {
            size: "xs",
            variant: "ghost",
            label: t("department.table.edit"),
            onClick: () => openEdit(row.original),
          })
        );
      }
      if (can("department.delete")) {
        buttons.push(
          h(UButton, {
            size: "xs",
            variant: "ghost",
            color: "error",
            label: t("department.table.delete"),
            onClick: () => openDelete(row.original),
          })
        );
      }
      return h("div", { class: "flex gap-1" }, buttons);
    },
  },
]);

loadUsers();
</script>

<template>
  <DashboardPanel :title="t('department.title')">
    <template v-if="can('department.read')">
    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <UButton v-if="can('department.create')" :label="t('department.createButton')" icon="i-lucide-plus" @click="openCreate" />
    </div>

    <UTable
      :loading="loading"
      loading-color="primary"
      loading-animation="carousel"
      :data="visibleRows"
      :columns="columns"
      class="flex-1 mt-3"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        {{ t("department.totalCount", { count: departmentCount }) }}
      </div>
      <UPagination
        v-model:page="page"
        :total="departmentCount"
        :page-size="pageSize"
        show-edges
        size="lg"
        @update:page="(p: number) => fetchDepartments(p)"
      />
    </div>

    <!-- 新建/编辑 -->
    <UModal v-model:open="open" :title="editing ? t('department.form.editTitle') : t('department.form.createTitle')">
      <template #body>
        <div class="flex flex-col gap-3">
          <UFormField :label="t('department.form.name')">
            <UInput v-model="form.name" :placeholder="t('department.form.namePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('department.form.parent')">
            <USelect
              v-model="form.parentId"
              :items="parentOptions"
              :placeholder="t('department.form.parentPlaceholder')"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="t('department.form.manager')">
            <USelect
              v-model="form.managerId"
              :items="users"
              :placeholder="t('department.form.managerPlaceholder')"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="t('department.form.workspace')">
            <UInput v-model="form.workspace" :placeholder="t('department.form.workspacePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('department.form.explain')">
            <UTextarea v-model="form.explain" :placeholder="t('department.form.explainPlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('department.form.addition')">
            <UInput v-model="form.addition" :placeholder="t('department.form.additionPlaceholder')" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="subtle" @click="open = false" />
          <UButton :label="t('common.save')" color="primary" @click="submit" />
        </div>
      </template>
    </UModal>

    <!-- 删除确认 -->
    <UModal v-model:open="deleteOpen" :title="t('department.delete.title', { name: deleteTarget?.name })">
      <template #body>
        {{ t("department.delete.confirm") }}
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="subtle" @click="deleteOpen = false" />
          <UButton :label="t('department.delete.confirmButton')" color="error" @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- 部门职位 -->
    <UModal v-model:open="positionsOpen" :title="t('department.positions.title', { name: positionsFor?.name })">
      <template #body>
        <div v-if="positionsLoading" class="text-muted">{{ t("department.positions.loading") }}</div>
        <div v-else-if="positionNames.length === 0" class="text-muted">{{ t("department.positions.empty") }}</div>
        <ul v-else class="flex flex-col gap-1">
          <li v-for="name in positionNames" :key="name" class="rounded bg-elevated px-3 py-2">
            {{ name }}
          </li>
        </ul>
      </template>
    </UModal>
    </template>
    <template v-else>
      <div class="flex flex-col items-center justify-center py-16 text-muted">
        <UIcon name="i-lucide-shield-x" class="size-12 mb-4 opacity-40" />
        <p class="text-lg">{{ t("department.noPermission") }}</p>
      </div>
    </template>
  </DashboardPanel>
</template>

<style scoped></style>
