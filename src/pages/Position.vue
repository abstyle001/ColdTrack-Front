<script setup lang="ts">
import { computed, h, ref, resolveComponent } from "vue";
import { useI18n } from "vue-i18n";
import type { Department, Position } from "../utils/types";
import { usePosition } from "../logic/usePosition";
import { usePermission } from "../logic/usePermission";
import {
  fetchDepartmentListRequest,
  fetchDepartmentsByPositionRequest,
  assignPositionDepartmentRequest,
  removePositionDepartmentRequest,
  fetchUsersByPositionRequest,
} from "../api/userApi";
import type { TableColumn } from "@nuxt/ui";

const { can } = usePermission();
const { t } = useI18n();

const {
  positionList,
  loading,
  page,
  pageSize,
  positionCount,
  fetchPositions,
  createPosition,
  updatePosition,
  deletePosition,
} = usePosition();

const toast = useToast();

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
const savingAssign = ref(false);

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
  savingAssign.value = true;
  let failed = false;
  for (const d of allDepartments.value) {
    const isSelected = selectedDeptIds.value.includes(d.id);
    const isCurrent = currentDeptIds.value.includes(d.id);
    if (isSelected && !isCurrent) {
      const err = await assignPositionDepartmentRequest(pid, d.id);
      if (err) {
        failed = true;
        toast.add({ title: t("position.toast.assignFailed"), description: err, color: "error" });
      }
    } else if (!isSelected && isCurrent) {
      const err = await removePositionDepartmentRequest(pid, d.id);
      if (err) {
        failed = true;
        toast.add({ title: t("position.toast.unassignFailed"), description: err, color: "error" });
      }
    }
  }
  savingAssign.value = false;
  if (!failed) {
    toast.add({ title: t("position.toast.saveSuccess"), description: t("position.toast.assignUpdated"), color: "success" });
    assignOpen.value = false;
  }
}

async function openMembers(position: Position) {
  membersFor.value = position;
  membersOpen.value = true;
  membersLoading.value = true;
  const data = await fetchUsersByPositionRequest(position.id);
  memberNames.value = data ? data.map((u) => u.nickName || u.userName) : [];
  membersLoading.value = false;
}

const columns = computed<TableColumn<Position>[]>(() => [
  { accessorKey: "name", header: t("position.table.name") },
  { accessorKey: "duty", header: t("position.table.duty"), cell: ({ row }) => h("span", { class: "text-muted truncate" }, row.original.duty) },
  { accessorKey: "workspace", header: t("position.table.workspace") },
  { accessorKey: "createdAt", header: t("position.table.createdAt") },
  {
    id: "actions",
    header: t("position.table.actions"),
    cell: ({ row }) => {
      const UButton = resolveComponent("UButton");
      const buttons: any[] = [];
      if (can("position.update")) {
        buttons.push(
          h(UButton, { size: "xs", variant: "ghost", label: t("position.actions.departments"), onClick: () => openAssign(row.original) })
        );
      }
      if (can("user.read")) {
        buttons.push(
          h(UButton, { size: "xs", variant: "ghost", label: t("position.actions.members"), onClick: () => openMembers(row.original) })
        );
      }
      if (can("position.update")) {
        buttons.push(h(UButton, { size: "xs", variant: "ghost", label: t("position.actions.edit"), onClick: () => openEdit(row.original) }));
      }
      if (can("position.delete")) {
        buttons.push(
          h(UButton, {
            size: "xs",
            variant: "ghost",
            color: "error",
            label: t("position.actions.delete"),
            onClick: () => openDelete(row.original),
          })
        );
      }
      return h("div", { class: "flex gap-1" }, buttons);
    },
  },
]);

loadDepartments();
</script>

<template>
  <DashboardPanel :title="t('position.title')">
    <template v-if="can('position.read')">
    <div class="flex flex-wrap items-center justify-end gap-1.5">
      <UButton v-if="can('position.create')" :label="t('position.create')" icon="i-lucide-plus" @click="openCreate" />
    </div>

    <UTable
      :loading="loading"
      loading-color="primary"
      loading-animation="carousel"
      :data="positionList"
      :columns="columns"
      class="flex-1 mt-3"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        {{ t('position.total', { count: positionCount }) }}
      </div>
      <UPagination
        v-model:page="page"
        :total="positionCount"
        :page-size="pageSize"
        show-edges
        size="lg"
        @update:page="(p: number) => fetchPositions(p)"
      />
    </div>

    <!-- 新建/编辑 -->
    <UModal v-model:open="open" :title="editing ? t('position.modal.editTitle') : t('position.modal.createTitle')">
      <template #body>
        <div class="flex flex-col gap-3">
          <UFormField :label="t('position.form.name')">
            <UInput v-model="form.name" :placeholder="t('position.form.namePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('position.form.duty')">
            <UTextarea v-model="form.duty" :placeholder="t('position.form.dutyPlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('position.form.workspace')">
            <UInput v-model="form.workspace" :placeholder="t('position.form.workspacePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('position.form.addition')">
            <UInput v-model="form.addition" :placeholder="t('position.form.additionPlaceholder')" class="w-full" />
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

    <!-- 分配部门 -->
    <UModal v-model:open="assignOpen" :title="t('position.modal.assignTitle', { name: assignTarget?.name })">
      <template #body>
        <div v-if="deptOptions.length === 0" class="text-muted">{{ t('position.assign.noDepartments') }}</div>
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
          <UButton :label="t('common.cancel')" color="neutral" variant="subtle" @click="assignOpen = false" />
          <UButton :label="t('common.save')" color="primary" @click="saveAssign" />
        </div>
      </template>
    </UModal>

    <!-- 删除确认 -->
    <UModal v-model:open="deleteOpen" :title="t('position.modal.deleteTitle', { name: deleteTarget?.name })">
      <template #body>
        {{ t('position.delete.confirm') }}
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="subtle" @click="deleteOpen = false" />
          <UButton :label="t('position.delete.confirmButton')" color="error" @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- 成员 -->
    <UModal v-model:open="membersOpen" :title="t('position.modal.membersTitle', { name: membersFor?.name })">
      <template #body>
        <div v-if="membersLoading" class="text-muted">{{ t('position.members.loading') }}</div>
        <div v-else-if="memberNames.length === 0" class="text-muted">{{ t('position.members.empty') }}</div>
        <ul v-else class="flex flex-col gap-1">
          <li v-for="name in memberNames" :key="name" class="rounded bg-elevated px-3 py-2">
            {{ name }}
          </li>
        </ul>
      </template>
    </UModal>
    </template>
    <template v-else>
      <div class="flex flex-col items-center justify-center py-16 text-muted">
        <UIcon name="i-lucide-shield-x" class="size-12 mb-4 opacity-40" />
        <p class="text-lg">{{ t('position.noPermission') }}</p>
      </div>
    </template>
  </DashboardPanel>
</template>

<style scoped></style>
