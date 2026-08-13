<script setup lang="ts">
import { ref, computed } from "vue";
import type { User, UserBrief } from "../utils/types";

const props = defineProps<{
  allUsers: UserBrief[];
  roleUsers: User[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  add: [userIds: string[]];
  remove: [userId: string];
}>();

const search = ref("");
const deptFilter = ref("");
const posFilter = ref("");
const selectedIds = ref(new Set<string>());

const available = computed(() => {
  const ids = new Set(props.roleUsers.map((u) => u.id));
  return props.allUsers.filter((u) => !ids.has(u.id));
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return available.value.filter((u) => {
    if (q && !(
      (u.nickName || "").toLowerCase().includes(q) ||
      (u.userName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    )) return false;
    if (deptFilter.value && !u.departmentNames.includes(deptFilter.value)) return false;
    if (posFilter.value && !u.positionNames.includes(posFilter.value)) return false;
    return true;
  });
});

const deptOptions = computed(() => {
  const set = new Set<string>();
  available.value.forEach((u) => u.departmentNames.forEach((d) => set.add(d)));
  return [...set].sort().map((d) => ({ label: d, value: d }));
});

const posOptions = computed(() => {
  const set = new Set<string>();
  available.value.forEach((u) => u.positionNames.forEach((p) => set.add(p)));
  return [...set].sort().map((p) => ({ label: p, value: p }));
});

const allFilteredSelected = computed(() => {
  if (filtered.value.length === 0) return false;
  return filtered.value.every((u) => selectedIds.value.has(u.id));
});

function toggleSelectAll() {
  const next = new Set(selectedIds.value);
  if (allFilteredSelected.value) {
    filtered.value.forEach((u) => next.delete(u.id));
  } else {
    filtered.value.forEach((u) => next.add(u.id));
  }
  selectedIds.value = next;
}

function toggleUser(id: string) {
  const next = new Set(selectedIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedIds.value = next;
}

function batchAdd() {
  if (selectedIds.value.size === 0) return;
  emit("add", [...selectedIds.value]);
  selectedIds.value = new Set();
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Left: available -->
    <div class="flex flex-col min-w-0">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold">可添加的用户</span>
        <span class="text-xs text-muted">{{ filtered.length }}</span>
      </div>

      <div class="flex flex-col gap-1.5 mb-2">
        <UInput v-model="search" placeholder="搜索姓名或邮箱…" icon="i-lucide-search" size="xs" />
        <div class="flex gap-1.5">
          <USelect v-model="deptFilter" :items="deptOptions" placeholder="全部部门" size="xs" class="flex-1" />
          <USelect v-model="posFilter" :items="posOptions" placeholder="全部职位" size="xs" class="flex-1" />
        </div>
      </div>

      <div class="max-h-60 overflow-auto border rounded-md">
        <div v-if="filtered.length === 0" class="text-muted text-xs p-3 text-center">
          无匹配用户
        </div>
        <div
          v-for="u in filtered"
          :key="u.id"
          class="flex items-center gap-1.5 px-2.5 py-1.5 border-b last:border-b-0"
        >
          <UCheckbox
            :model-value="selectedIds.has(u.id)"
            @update:model-value="toggleUser(u.id)"
          />
          <span class="flex-1 text-sm truncate min-w-0">{{ u.nickName || u.userName }}</span>
          <div class="hidden md:flex gap-1 shrink-0">
            <UBadge v-for="d in u.departmentNames.slice(0, 2)" :key="d" size="xs" color="neutral" variant="subtle">
              {{ d }}
            </UBadge>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mt-2">
        <UCheckbox
          :model-value="allFilteredSelected"
          @update:model-value="toggleSelectAll()"
          label="全选"
        />
        <UButton
          size="xs"
          color="primary"
          variant="solid"
          :disabled="selectedIds.size === 0"
          :loading="loading"
          @click="batchAdd"
        >
          添加选中 ({{ selectedIds.size }})
        </UButton>
      </div>
    </div>

    <!-- Right: members -->
    <div class="flex flex-col min-w-0">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold">当前成员</span>
        <span class="text-xs text-muted">{{ roleUsers.length }}</span>
      </div>

      <div class="max-h-72 overflow-auto border rounded-md">
        <div v-if="roleUsers.length === 0" class="text-muted text-xs p-3 text-center">
          暂无成员
        </div>
        <div
          v-for="u in roleUsers"
          :key="u.id"
          class="flex items-center justify-between px-2.5 py-1.5 border-b last:border-b-0"
        >
          <div class="flex-1 min-w-0">
            <span class="text-sm">{{ u.nickName || u.userName }}</span>
            <span class="text-xs text-muted ml-1.5 hidden md:inline">{{ u.email }}</span>
          </div>
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-x"
            :disabled="loading"
            @click="emit('remove', u.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
