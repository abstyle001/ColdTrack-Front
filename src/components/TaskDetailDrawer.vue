<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task, TaskComment } from '../utils/types';
import {
  fetchTaskCommentsRequest,
  createTaskCommentRequest,
} from '../api/userApi';
import { usePermission } from '../logic/usePermission';

const props = defineProps<{ task: Task | null }>();
const open = defineModel<boolean>('open', { default: false });

const { can } = usePermission();
const { t } = useI18n();
const toast = useToast();

const comments = ref<TaskComment[]>([]);
const commentsLoading = ref(false);
const newContent = ref('');
const sending = ref(false);

const statusLabel = computed<Record<string, string>>(() => ({
  Todo: t('task.status.todo'),
  InProgress: t('task.status.inProgress'),
  Review: t('task.status.review'),
  Completed: t('task.status.completed'),
}));
const statusColor: Record<string, string> = {
  Todo: 'neutral',
  InProgress: 'info',
  Review: 'warning',
  Completed: 'success',
};

const priorityLabel = computed<Record<string, string>>(() => ({
  Low: t('task.priority.low'),
  Medium: t('task.priority.medium'),
  High: t('task.priority.high'),
  Urgent: t('task.priority.urgent'),
}));
const priorityColor: Record<string, string> = {
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Urgent: 'error',
};

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function avatarText(c: TaskComment): string {
  return (c.authorName || '?').charAt(0);
}

async function loadComments() {
  if (!props.task) return;
  commentsLoading.value = true;
  const data = await fetchTaskCommentsRequest(props.task.id);
  comments.value = data ?? [];
  commentsLoading.value = false;
}

// 抽屉打开（或任务切换）时重新加载评论
watch([open, () => props.task?.id], ([isOpen]) => {
  if (isOpen) {
    newContent.value = '';
    loadComments();
  }
});

async function submitComment() {
  const content = newContent.value.trim();
  if (!content || sending.value || !props.task) return;
  sending.value = true;
  const r = await createTaskCommentRequest(props.task.id, content);
  sending.value = false;
  if (r.err) {
    toast.add({
      title: t('task.toast.commentFailed'),
      description: r.err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error',
    });
    return;
  }
  newContent.value = '';
  if (r.data) comments.value.push(r.data);
  toast.add({
    title: t('task.toast.commentSuccess'),
    description: t('task.toast.commentPublished'),
    icon: 'i-material-symbols:check-circle-outline',
    color: 'success',
  });
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="task ? task.title : t('task.drawer.detailTitle')"
    :description="task ? t('task.drawer.createdBy', { name: task.creatorName || '—' }) : undefined"
  >
    <template #body>
      <div v-if="task" class="flex flex-col gap-4">
        <!-- 状态 / 优先级标签 -->
        <div class="flex flex-wrap items-center gap-1.5">
          <UBadge
            :label="statusLabel[task.status] || task.status"
            :color="statusColor[task.status] || 'neutral'"
            variant="solid"
            size="sm"
          />
          <UBadge
            :label="priorityLabel[task.priority] || task.priority"
            :color="priorityColor[task.priority] || 'neutral'"
            variant="soft"
            size="sm"
          />
        </div>

        <!-- 标签 -->
        <div v-if="task.tags && task.tags.length" class="flex flex-wrap items-center gap-1.5">
          <UBadge
            v-for="tag in task.tags"
            :key="tag.id"
            :label="tag.name"
            :color="tag.color || 'neutral'"
            variant="soft"
            size="sm"
          />
        </div>

        <!-- 任务描述 -->
        <div v-if="task.description">
          <p class="text-xs text-muted mb-1.5">{{ t('task.drawer.description') }}</p>
          <p class="text-sm whitespace-pre-wrap">{{ task.description }}</p>
        </div>

        <!-- 元信息 -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-md border border-default bg-elevated/40 p-3">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">{{ t('task.drawer.assignee') }}</span>
            <span class="text-sm">{{ task.assigneeName || t('task.drawer.unassigned') }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">{{ t('task.drawer.creator') }}</span>
            <span class="text-sm">{{ task.creatorName || '—' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">{{ t('task.drawer.deadline') }}</span>
            <span class="text-sm" :class="isOverdue(task.deadline) ? 'text-error' : ''">
              {{ task.deadline || '—' }}
            </span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">{{ t('task.drawer.createdAt') }}</span>
            <span class="text-sm">{{ task.createdAt }}</span>
          </div>
        </div>

        <USeparator />

        <!-- 评论区 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium">{{ t('task.drawer.comments') }}</span>
            <UBadge :label="String(comments.length)" color="neutral" variant="soft" size="xs" />
          </div>

          <div v-if="commentsLoading" class="flex items-center justify-center py-8 text-muted text-sm">
            {{ t('task.drawer.loading') }}
          </div>
          <div
            v-else-if="comments.length === 0"
            class="flex flex-col items-center justify-center py-8 text-muted/60 text-sm"
          >
            <UIcon name="i-lucide-message-square" class="size-7 mb-2 opacity-50" />
            {{ t('task.drawer.emptyComments') }}
          </div>
          <div v-else class="space-y-3.5">
            <div v-for="c in comments" :key="c.id" class="flex gap-2.5">
              <UAvatar
                :src="c.authorAvatar || undefined"
                :alt="c.authorName || t('task.drawer.unknownUser')"
                :text="avatarText(c)"
                size="sm"
              />
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2">
                  <span class="text-sm font-medium">{{ c.authorName || t('task.drawer.deletedUser') }}</span>
                  <span class="text-xs text-muted">{{ c.createdAt }}</span>
                </div>
                <p class="text-sm whitespace-pre-wrap break-words mt-0.5">{{ c.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div v-if="task" class="w-full min-w-0">
        <template v-if="can('task.comment')">
          <UTextarea
            v-model="newContent"
            :rows="3"
            :placeholder="t('task.drawer.commentPlaceholder')"
            class="w-full"
          />
          <div class="flex justify-end mt-2">
            <UButton
              :label="t('task.drawer.sendComment')"
              icon="i-lucide-send"
              :loading="sending"
              :disabled="!newContent.trim()"
              @click="submitComment"
            />
          </div>
        </template>
        <p v-else class="text-center text-xs text-muted">{{ t('task.drawer.noCommentPermission') }}</p>
      </div>
    </template>
  </USlideover>
</template>

<style scoped></style>
