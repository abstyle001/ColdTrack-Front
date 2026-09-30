<script setup lang="ts">
import { ref, computed, onMounted, h, resolveComponent, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePermission } from "../logic/usePermission";
import {
  fetchRolesRequest,
  fetchPermissionsCatalogRequest,
  fetchUserBriefRequest,
  fetchRoleUsersRequest,
  fetchUserRolesRequest,
  createRoleRequest,
  updateRolePermissionsRequest,
  addUserToRoleRequest,
  removeUserFromRoleRequest,
} from "../api/userApi";
import type { Role, Permission, User, UserBrief } from "../utils/types";
import UserTransfer from "../components/UserTransfer.vue";

const toast = useToast();
const { can } = usePermission();
const { t } = useI18n();

const roles = ref<Role[]>([]);
const permissionCatalog = ref<Permission[]>([]);
const allUserBriefs = ref<UserBrief[]>([]);
const roleUsers = ref<User[]>([]);
const loading = ref(false);

const groupedPermissions = computed(() => {
  const map = new Map<string, Permission[]>();
  for (const p of permissionCatalog.value) {
    if (!map.has(p.group)) map.set(p.group, []);
    map.get(p.group)!.push(p);
  }
  return [...map.entries()].map(([group, perms]) => ({ group, perms }));
});

// ─── create role ───
const createOpen = ref(false);
const createName = ref("");
const creating = ref(false);

function openCreate() {
  createName.value = "";
  createOpen.value = true;
}

async function submitCreate() {
  if (!createName.value.trim()) return;
  creating.value = true;
  const { err } = await createRoleRequest(createName.value.trim());
  creating.value = false;
  if (err) {
    toast.add({ title: t("rolePermission.toast.createFailed"), description: err, color: "error" });
    return;
  }
  toast.add({ title: t("rolePermission.toast.roleCreated"), color: "success" });
  createOpen.value = false;
  await loadRoles();
}

// ─── permissions modal ───
const permOpen = ref(false);
const permTarget = ref<Role | null>(null);
const selectedKeys = ref<Set<string>>(new Set());
const savingPerms = ref(false);

function openPerms(role: Role) {
  permTarget.value = role;
  selectedKeys.value = new Set(role.permissions.map((p) => p.key));
  permOpen.value = true;
}

function togglePermKey(key: string) {
  const next = new Set(selectedKeys.value);
  next.has(key) ? next.delete(key) : next.add(key);
  selectedKeys.value = next;
}

async function savePerms() {
  if (!permTarget.value) return;
  savingPerms.value = true;
  const err = await updateRolePermissionsRequest(
    permTarget.value.id,
    [...selectedKeys.value]
  );
  savingPerms.value = false;
  if (err) {
    toast.add({ title: t("rolePermission.toast.saveFailed"), description: err, color: "error" });
    return;
  }
  toast.add({ title: t("rolePermission.toast.permsUpdated"), color: "success" });
  permOpen.value = false;
  await loadRoles();
}

// ─── users modal ───
const userOpen = ref(false);
const userTarget = ref<Role | null>(null);
const savingUsers = ref(false);

async function openUsers(role: Role) {
  userTarget.value = role;
  roleUsers.value = (await fetchRoleUsersRequest(role.id)) ?? [];
  userOpen.value = true;
}

async function handleAddUsers(userIds: string[]) {
  if (!userTarget.value) return;
  savingUsers.value = true;
  for (const uid of userIds) {
    const err = await addUserToRoleRequest(userTarget.value.id, uid);
    if (err) {
      toast.add({ title: t("rolePermission.toast.addFailed"), description: err, color: "error" });
    }
  }
  toast.add({ title: t("rolePermission.toast.addedUsers", { count: userIds.length }), color: "success" });
  roleUsers.value = (await fetchRoleUsersRequest(userTarget.value.id)) ?? [];
  savingUsers.value = false;
}

async function handleRemoveUser(userId: string) {
  if (!userTarget.value) return;
  savingUsers.value = true;
  const err = await removeUserFromRoleRequest(userTarget.value.id, userId);
  if (err) {
    toast.add({ title: t("rolePermission.toast.removeFailed"), description: err, color: "error" });
  } else {
    toast.add({ title: t("rolePermission.toast.removed"), color: "success" });
    roleUsers.value = (await fetchRoleUsersRequest(userTarget.value.id)) ?? [];
  }
  savingUsers.value = false;
}

// ─── audit user roles ───
const auditUserId = ref("");
const auditUserRoles = ref<Role[]>([]);
const auditLoading = ref(false);

watch(auditUserId, async (uid) => {
  auditUserRoles.value = [];
  if (!uid) return;
  auditLoading.value = true;
  auditUserRoles.value = (await fetchUserRolesRequest(uid)) ?? [];
  auditLoading.value = false;
});

async function removeUserRole(roleId: string, userId: string) {
  const err = await removeUserFromRoleRequest(roleId, userId);
  if (err) {
    toast.add({ title: t("rolePermission.toast.removeRoleFailed"), description: err, color: "error" });
  } else {
    toast.add({ title: t("rolePermission.toast.roleRemoved"), color: "success" });
    auditUserRoles.value = (await fetchUserRolesRequest(userId)) ?? [];
    roleUsers.value = (await fetchRoleUsersRequest(userTarget.value?.id ?? "")) ?? [];
  }
}

// ─── data ───
async function loadRoles() {
  loading.value = true;
  const data = await fetchRolesRequest();
  roles.value = data ?? [];
  loading.value = false;
}

onMounted(async () => {
  loading.value = true;
  const [r, p, u] = await Promise.all([
    fetchRolesRequest(),
    fetchPermissionsCatalogRequest(),
    fetchUserBriefRequest(),
  ]);
  roles.value = r ?? [];
  permissionCatalog.value = p ?? [];
  allUserBriefs.value = u ?? [];
  loading.value = false;
});

// ─── table columns ───
const columns = computed(() => [
  { accessorKey: "name", header: t("rolePermission.table.name") },
  {
    accessorKey: "permissions",
    header: t("rolePermission.table.permCount"),
    cell: ({ row }: { row: any }) => {
      const count = row.original.permissions?.length ?? 0;
      return h("span", { class: "font-mono" }, `${count}`);
    },
  },
  {
    id: "actions",
    header: t("rolePermission.table.actions"),
    cell: ({ row }: { row: any }) => {
      const role = row.original as Role;
      const UButton = resolveComponent("UButton");
      const buttons = [];
      if (role.name !== "Admin") {
        buttons.push(
          h(UButton, {
            size: "xs",
            variant: "ghost",
            label: t("rolePermission.table.managePerms"),
            onClick: () => openPerms(role),
          })
        );
      }
      if (role.name !== "Admin") {
        buttons.push(
          h(UButton, {
            size: "xs",
            variant: "ghost",
            label: t("rolePermission.table.manageUsers"),
            onClick: () => openUsers(role),
          })
        );
      }
      return h("div", { class: "flex gap-1" }, buttons);
    },
  },
]);
</script>

<template>
  <DashboardPanel :title="t('rolePermission.title')">
    <div class="flex flex-wrap items-center justify-between gap-1.5 mb-3">
      <UButton
        v-if="can('role.manage')"
        :label="t('rolePermission.newRole')"
        icon="i-lucide-plus"
        @click="openCreate" />
    </div>

    <UTable
      :loading="loading"
      loading-color="primary"
      loading-animation="carousel"
      :data="roles"
      :columns="columns"
      class="flex-1" />

    <!-- Modal: 新建角色 -->
    <UModal v-model:open="createOpen" :title="t('rolePermission.createModal.title')">
      <template #body>
        <div class="flex flex-col gap-3">
          <UFormField :label="t('rolePermission.createModal.nameLabel')" required>
            <UInput v-model="createName" :placeholder="t('rolePermission.createModal.namePlaceholder')" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="subtle" @click="createOpen = false" />
          <UButton :label="t('common.save')" color="primary" :loading="creating" @click="submitCreate" />
        </div>
      </template>
    </UModal>

    <!-- Modal: 管理权限 -->
    <UModal v-model:open="permOpen" :title="t('rolePermission.permModal.title', { name: permTarget?.name ?? '' })">
      <template #body>
        <div class="flex flex-col gap-4 max-h-96 overflow-auto">
          <div v-for="grp in groupedPermissions" :key="grp.group">
            <p class="font-semibold text-sm text-highlighted mb-2">{{ grp.group }}</p>
            <div class="flex flex-col gap-1 pl-2">
              <UCheckbox
                v-for="perm in grp.perms"
                :key="perm.key"
                :model-value="selectedKeys.has(perm.key)"
                :label="perm.name"
                @update:model-value="togglePermKey(perm.key)" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="subtle" @click="permOpen = false" />
          <UButton :label="t('common.save')" color="primary" :loading="savingPerms" @click="savePerms" />
        </div>
      </template>
    </UModal>

    <!-- Modal: 管理用户 -->
    <UModal v-model:open="userOpen" :title="t('rolePermission.userModal.title', { name: userTarget?.name ?? '' })">
      <template #body>
        <div class="flex flex-col gap-4">
          <!-- Transfer panel: add / remove users -->
          <UserTransfer
            :all-users="allUserBriefs"
            :role-users="roleUsers"
            :loading="savingUsers"
            @add="handleAddUsers"
            @remove="handleRemoveUser"
          />

          <USeparator />

          <!-- Audit user roles -->
          <div>
            <p class="font-semibold text-sm mb-2">{{ t('rolePermission.userModal.auditTitle') }}</p>
            <div class="flex gap-2 mb-2">
              <USelect
                v-model="auditUserId"
                :items="allUserBriefs.map(u => ({ label: (u.nickName || u.userName) + ' (' + u.email + ')', value: u.id }))"
                :placeholder="t('rolePermission.userModal.selectUser')"
                class="flex-1" />
            </div>
            <div v-if="auditUserId && auditLoading" class="text-muted text-sm">{{ t('rolePermission.userModal.loading') }}</div>
            <div v-else-if="auditUserId && auditUserRoles.length === 0" class="text-muted text-sm">{{ t('rolePermission.userModal.noRoles') }}</div>
            <div v-else-if="auditUserId" class="flex flex-col gap-1">
              <div
                v-for="r in auditUserRoles"
                :key="r.id"
                class="flex items-center justify-between rounded bg-elevated px-3 py-2">
                <span class="flex items-center gap-2">
                  {{ r.name }}
                  <UBadge v-if="r.name === 'User'" size="xs" color="warning" variant="subtle">{{ t('rolePermission.userModal.defaultRole') }}</UBadge>
                </span>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  :label="t('rolePermission.userModal.removeRole')"
                  @click="removeUserRole(r.id, auditUserId)" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </DashboardPanel>
</template>