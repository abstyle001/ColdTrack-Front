<script setup lang="ts">
import { ref } from 'vue';
import type { Task } from '../utils/types';
import { updateTaskStatusRequest } from '../api/userApi';

const props = defineProps<{
  tasks: Task[];
  canUpdate: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'delete', task: Task): void;
  (e: 'detail', task: Task): void;
  (e: 'statusChanged'): void;
}>();

const columns = [
  { key: 'Todo', label: '待办', color: 'text-muted' },
  { key: 'InProgress', label: '进行中', color: 'text-info' },
  { key: 'Review', label: '审核', color: 'text-warning' },
  { key: 'Completed', label: '已完成', color: 'text-success' },
] as const;

const priorityColor: Record<string, string> = {
  Low: 'bg-muted',
  Medium: 'bg-info',
  High: 'bg-warning',
  Urgent: 'bg-error',
};

const priorityLabel: Record<string, string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Urgent: '紧急',
};

const draggingId = ref<number | null>(null);

function grouped(key: string) {
  return props.tasks.filter((t) => t.status === key);
}

function onDragStart(e: DragEvent, taskId: number) {
  draggingId.value = taskId;
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', String(taskId));
  const el = e.target as HTMLElement;
  el.classList.add('opacity-50');
}

function onDragEnd(e: DragEvent) {
  draggingId.value = null;
  const el = e.target as HTMLElement;
  el.classList.remove('opacity-50');
}

async function onDrop(e: DragEvent, targetStatus: string) {
  draggingId.value = null;
  const rawId = e.dataTransfer?.getData('text/plain');
  if (!rawId) return;
  const taskId = Number(rawId);
  if (!taskId) return;

  const task = props.tasks.find((t) => t.id === taskId);
  if (!task || task.status === targetStatus) return;

  const result = await updateTaskStatusRequest(taskId, targetStatus);
  const toast = useToast();
  if (result.err) {
    toast.add({
      title: '状态更新失败',
      description: result.err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error',
    });
    return;
  }
  toast.add({
    title: '状态更新成功',
    description: '任务状态已更新',
    icon: 'i-material-symbols:check-circle-outline',
    color: 'success',
  });
  emit('statusChanged');
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
}

function countByStatus(key: string) {
  return grouped(key).length;
}
</script>

<template>
  <div class="grid grid-cols-4 gap-3 min-h-[60vh]">
    <div
      v-for="col in columns"
      :key="col.key"
      class="flex flex-col rounded-lg border border-default bg-elevated/30"
    >
      <div class="flex items-center justify-between px-3 py-2.5 border-b border-default">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="col.color.replace('text-', 'bg-')" />
          <span class="text-sm font-medium">{{ col.label }}</span>
        </div>
        <UBadge :label="String(countByStatus(col.key))" color="neutral" variant="soft" size="xs" />
      </div>
      <div
        class="flex-1 p-2 space-y-2 overflow-y-auto transition-colors"
        :class="draggingId ? 'bg-primary/5' : ''"
        @dragover="onDragOver"
        @drop="onDrop($event, col.key)"
      >
        <div
          v-for="task in grouped(col.key)"
          :key="task.id"
          class="rounded-md border border-default bg-elevated p-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
          draggable="true"
          @dragstart="onDragStart($event, task.id)"
          @dragend="onDragEnd"
        >
          <div class="flex items-start justify-between gap-1.5 mb-1.5">
            <span class="text-sm font-medium leading-snug line-clamp-2">{{ task.title }}</span>
            <div class="flex items-center gap-0.5 shrink-0">
              <UButton
                icon="i-lucide-eye"
                size="xs"
                variant="ghost"
                color="neutral"
                class="size-6"
                aria-label="查看详情"
                @click.stop="emit('detail', task)"
              />
              <UButton
                v-if="canUpdate"
                icon="i-lucide-pencil"
                size="xs"
                variant="ghost"
                color="neutral"
                class="size-6"
                @click.stop="emit('edit', task)"
              />
              <UButton
                v-if="canDelete"
                icon="i-lucide-trash"
                size="xs"
                variant="ghost"
                color="error"
                class="size-6"
                @click.stop="emit('delete', task)"
              />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted mb-1.5">
            <UBadge
              :label="priorityLabel[task.priority] || task.priority"
              :color="priorityColor[task.priority]?.replace('bg-', '') || 'neutral'"
              variant="soft"
              size="xs"
            />
            <span v-if="task.deadline" class="flex items-center gap-0.5" :class="new Date(task.deadline) < new Date() ? 'text-error' : ''">
              <UIcon name="i-lucide-calendar" class="size-3" />
              {{ task.deadline.slice(0, 10) }}
            </span>
          </div>
          <div v-if="task.tags && task.tags.length" class="flex flex-wrap gap-1 mb-1.5">
            <UBadge
              v-for="tag in task.tags"
              :key="tag.id"
              :label="tag.name"
              :color="tag.color || 'neutral'"
              variant="soft"
              size="xs"
            />
          </div>
          <div v-if="task.assigneeName" class="flex items-center gap-1 text-xs text-muted">
            <UIcon name="i-lucide-user" class="size-3" />
            {{ task.assigneeName }}
          </div>
        </div>
        <div
          v-if="countByStatus(col.key) === 0"
          class="flex flex-col items-center justify-center py-8 text-muted/50 text-xs"
        >
          <UIcon name="i-lucide-inbox" class="size-6 mb-1" />
          拖拽任务到此处
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

