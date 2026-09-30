<script setup lang="ts">
import { computed, h, ref, resolveComponent, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { User, UserPositionView } from '../utils/types';
import type { TableColumn } from '@nuxt/ui';
import { usePerson } from '../logic/usePerson';
import { usePermission } from '../logic/usePermission';
import {
  fetchUserPositionsRequest,
  createUserRequest,
  fetchPositionListRequest,
  assignUserPositionRequest,
  removeUserPositionRequest,
} from '../api/userApi';

const { can } = usePermission();
const { t } = useI18n();

// 人员表格ref
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table: any = useTemplateRef("table");
const toast = useToast();

const {
  userList,
  loading,
  userCount,
  open,
  updatePage,
  fetchUserListPage,
  fetchUserCount,
  filter,
  deleteBatch
} = usePerson(table);

// 新增人员
const createOpen = ref(false);
const creating = ref(false);
const createForm = ref<Partial<User> & { email: string; password: string }>({
  email: "",
  password: "",
  nickName: "",
  city: "",
  phone: "",
});
const createAvatar = ref<File | null>(null);

function openCreate() {
  createForm.value = { email: "", password: "", nickName: "", city: "", phone: "" };
  createAvatar.value = null;
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.value.email || !createForm.value.password) return;
  creating.value = true;
  const { err } = await createUserRequest(createForm.value, createAvatar.value);
  creating.value = false;
  if (err) {
    toast.add({
      title: t('person.toast.createFailed'),
      description: err,
      icon: "i-material-symbols:error-circle-rounded-outline-sharp",
      color: "error",
    });
    return;
  }
  toast.add({
    title: t('person.toast.createSuccess'),
    description: t('person.toast.createdDesc'),
    icon: "i-material-symbols:check-circle-outline",
    color: "success",
  });
  createOpen.value = false;
  fetchUserCount();
  fetchUserListPage();
}

// 每个用户的职位/部门聚合
const positionsMap = ref<Record<string, UserPositionView[]>>({});
const positionsSig = ref("");

watch(
  () => userList.value,
  async (list) => {
    const ids = list.map((u) => u.id).join(",");
    if (ids === positionsSig.value) return;
    positionsSig.value = ids;
    const map: Record<string, UserPositionView[]> = {};
    await Promise.all(
      list.map(async (u) => {
        const data = await fetchUserPositionsRequest(u.id);
        map[u.id] = data ?? [];
      })
    );
    positionsMap.value = map;
  },
  { immediate: true }
);

function positionText(views?: UserPositionView[]): string {
  if (!views || views.length === 0) return "—";
  return views
    .map((v) => `${v.positionName}${v.departmentName ? `（${v.departmentName}）` : ""}`)
    .join("、");
}

// 所有职位选项
const positionOptions = ref<{ label: string; value: number }[]>([]);
// 分配职位弹窗
const assignOpen = ref(false);
const assignTarget = ref<User | null>(null);
const selectedPositionIds = ref<number[]>([]);
const savingAssign = ref(false);

async function loadPositions() {
  const data = await fetchPositionListRequest();
  if (data) {
    positionOptions.value = data.map((p) => ({ label: p.name, value: p.id }));
  }
}

function openAssign(user: User) {
  assignTarget.value = user;
  const current = positionsMap.value[user.id] ?? [];
  selectedPositionIds.value = current.map((v) => v.positionId);
  assignOpen.value = true;
}

async function saveAssign() {
  if (!assignTarget.value) return;
  const uid = assignTarget.value.id;
  const current = (positionsMap.value[uid] ?? []).map((v) => v.positionId);
  const selected = selectedPositionIds.value;
  const toAdd = selected.filter((id) => !current.includes(id));
  const toRemove = current.filter((id) => !selected.includes(id));

  savingAssign.value = true;
  let failed = false;
  for (const id of toAdd) {
    const err = await assignUserPositionRequest(uid, id);
    if (err) {
      failed = true;
      toast.add({ title: t('person.toast.assignFailed'), description: err, icon: "i-material-symbols:error-circle-rounded-outline-sharp", color: "error" });
    }
  }
  for (const id of toRemove) {
    const err = await removeUserPositionRequest(uid, id);
    if (err) {
      failed = true;
      toast.add({ title: t('person.toast.unassignFailed'), description: err, icon: "i-material-symbols:error-circle-rounded-outline-sharp", color: "error" });
    }
  }
  savingAssign.value = false;

  if (!failed) {
    const data = await fetchUserPositionsRequest(uid);
    positionsMap.value = { ...positionsMap.value, [uid]: data ?? [] };
    toast.add({ title: t('person.toast.saveSuccess'), description: t('person.toast.assignUpdated'), icon: "i-material-symbols:check-circle-outline", color: "success" });
    assignOpen.value = false;
  }
}

const page = ref<number>(1);

const UIcon = resolveComponent('UIcon');
const UAvatar = resolveComponent('UAvatar');
const UCheckbox = resolveComponent('UCheckbox');

const columns = computed<TableColumn<User>[]>(() => [
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
    header: t('person.columns.avatar'),
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
    header: t('person.columns.userName'),
  },
  {
    accessorKey: 'email',
    header: t('person.columns.email'),
  },
  {
    accessorKey: 'phone',
    header: t('person.columns.phone'),
  },
  {
    accessorKey: 'city',
    header: t('person.columns.city'),
  },
  {
    id: 'positions',
    header: t('person.columns.positions'),
    cell: ({ row }) =>
      h('span', { class: 'text-muted' }, positionText(positionsMap.value[row.original.id])),
  },
  {
    accessorKey: 'createdAt',
    header: t('person.columns.createdAt'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-2' }, [h(UIcon, { class: 'size-5', name: 'i-meteor-icons:alarm-clock' }), h('span', row.getValue('createdAt'))]);
    }
  },
  {
    id: 'actions',
    header: t('person.columns.actions'),
    cell: ({ row }) => {
      if (!can('user.assign')) return null;
      const UButton = resolveComponent('UButton');
      return h(UButton, {
        size: 'xs',
        variant: 'ghost',
        label: t('person.columns.assignPosition'),
        onClick: () => openAssign(row.original),
      });
    },
  },
]);

loadPositions();


</script>

<template>
  <DashboardPanel :title="t('person.title')">
    <template v-if="can('user.read')">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput class="max-w-sm" icon="i-lucide-search" :placeholder="t('person.filterPlaceholder')" @update:model-value="filter" />
        <div class="flex flex-wrap items-center gap-1.5">
          <UButton v-if="can('user.create')" :label="t('person.add')" icon="i-lucide-plus" @click="openCreate" />
        <UModal :title="t('person.deleteModalTitle', { count: table?.tableApi.getSelectedRowModel().rows.length ?? 0 })" v-model:open="open">
          <UButton v-if="can('user.delete')" :label="t('person.delete')" color="error" variant="subtle" icon="i-lucide-trash"></UButton>
          <template #body>
            {{ t('person.deleteConfirm') }}
            <div class="flex justify-end gap-2">
              <UButton :label="t('person.cancel')" color="neutral" variant="subtle" @click="open = false" />
              <UButton :label="t('person.confirm')" color="error" variant="solid" loading-auto @click="deleteBatch" />
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

    <!-- 新增人员 -->
    <UModal v-model:open="createOpen" :title="t('person.create.title')">
      <template #body>
        <div class="flex flex-col gap-3">
          <UFormField :label="t('person.create.email')" required>
            <UInput v-model="createForm.email" :placeholder="t('person.create.emailPlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('person.create.password')" required>
            <UInput v-model="createForm.password" type="password" :placeholder="t('person.create.passwordPlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('person.create.nickName')">
            <UInput v-model="createForm.nickName" :placeholder="t('person.create.nickNamePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('person.create.phone')">
            <UInput v-model="createForm.phone" :placeholder="t('person.create.phonePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('person.create.city')">
            <UInput v-model="createForm.city" :placeholder="t('person.create.cityPlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('person.create.avatar')">
            <UInput type="file" @change="(e: Event) => {
              const target = e.target as HTMLInputElement;
              createAvatar = target.files ? target.files[0] : null;
            }" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('person.cancel')" color="neutral" variant="subtle" @click="createOpen = false" />
          <UButton :label="t('person.save')" color="primary" :loading="creating" @click="submitCreate" />
        </div>
      </template>
    </UModal>

    <!-- 分配职位 -->
    <UModal v-model:open="assignOpen" :title="t('person.assign.title', { name: assignTarget?.nickName ?? '' })">
      <template #body>
        <div v-if="positionOptions.length === 0" class="text-muted">{{ t('person.assign.empty') }}</div>
        <div class="flex flex-col gap-1 max-h-80 overflow-auto">
          <UCheckbox
            v-for="opt in positionOptions"
            :key="opt.value"
            :model-value="selectedPositionIds.includes(opt.value)"
            :label="opt.label"
            @update:model-value="(v: boolean | 'indeterminate') => v ? selectedPositionIds.includes(opt.value) || selectedPositionIds.push(opt.value) : selectedPositionIds = selectedPositionIds.filter(id => id !== opt.value)"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('person.cancel')" color="neutral" variant="subtle" @click="assignOpen = false" />
          <UButton :label="t('person.save')" color="primary" :loading="savingAssign" @click="saveAssign" />
        </div>
      </template>
    </UModal>
    </template>
    <template v-else>
      <div class="flex flex-col items-center justify-center py-16 text-muted">
        <UIcon name="i-lucide-shield-x" class="size-12 mb-4 opacity-40" />
        <p class="text-lg">{{ t('person.noPermission') }}</p>
      </div>
    </template>
  </DashboardPanel>
</template>

<style scoped></style>
