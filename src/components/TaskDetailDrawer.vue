<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Task, TaskComment } from '../utils/types';
import {
  fetchTaskCommentsRequest,
  createTaskCommentRequest,
} from '../api/userApi';
import { usePermission } from '../logic/usePermission';

const props = defineProps<{ task: Task | null }>();
const open = defineModel<boolean>('open', { default: false });

const { can } = usePermission();
const toast = useToast();

const comments = ref<TaskComment[]>([]);
const commentsLoading = ref(false);
const newContent = ref('');
const sending = ref(false);

const statusLabel: Record<string, string> = {
  Todo: '待办',
  InProgress: '进行中',
  Review: '审核',
  Completed: '已完成',
};
const statusColor: Record<string, string> = {
  Todo: 'neutral',
  InProgress: 'info',
  Review: 'warning',
  Completed: 'success',
};

const priorityLabel: Record<string, string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Urgent: '紧急',
};
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
      title: '评论失败',
      description: r.err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error',
    });
    return;
  }
  newContent.value = '';
  if (r.data) comments.value.push(r.data);
  toast.add({
    title: '评论成功',
    description: '评论已发布',
    icon: 'i-material-symbols:check-circle-outline',
    color: 'success',
  });
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="task ? task.title : '任务详情'"
    :description="task ? '由 ' + (task.creatorName || '—') + ' 创建' : undefined"
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
          <p class="text-xs text-muted mb-1.5">任务描述</p>
          <p class="text-sm whitespace-pre-wrap">{{ task.description }}</p>
        </div>

        <!-- 元信息 -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-md border border-default bg-elevated/40 p-3">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">负责人</span>
            <span class="text-sm">{{ task.assigneeName || '未分配' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">创建人</span>
            <span class="text-sm">{{ task.creatorName || '—' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">截止日期</span>
            <span class="text-sm" :class="isOverdue(task.deadline) ? 'text-error' : ''">
              {{ task.deadline || '—' }}
            </span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">创建时间</span>
            <span class="text-sm">{{ task.createdAt }}</span>
          </div>
        </div>

        <USeparator />

        <!-- 评论区 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium">评论</span>
            <UBadge :label="String(comments.length)" color="neutral" variant="soft" size="xs" />
          </div>

          <div v-if="commentsLoading" class="flex items-center justify-center py-8 text-muted text-sm">
            加载中...
          </div>
          <div
            v-else-if="comments.length === 0"
            class="flex flex-col items-center justify-center py-8 text-muted/60 text-sm"
          >
            <UIcon name="i-lucide-message-square" class="size-7 mb-2 opacity-50" />
            暂无评论，来说点什么吧
          </div>
          <div v-else class="space-y-3.5">
            <div v-for="c in comments" :key="c.id" class="flex gap-2.5">
              <UAvatar
                :src="c.authorAvatar || undefined"
                :alt="c.authorName || '未知用户'"
                :text="avatarText(c)"
                size="sm"
              />
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2">
                  <span class="text-sm font-medium">{{ c.authorName || '已删除用户' }}</span>
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
            placeholder="写下你的评论…"
            class="w-full"
          />
          <div class="flex justify-end mt-2">
            <UButton
              label="发送评论"
              icon="i-lucide-send"
              :loading="sending"
              :disabled="!newContent.trim()"
              @click="submitComment"
            />
          </div>
        </template>
        <p v-else class="text-center text-xs text-muted">您没有评论权限</p>
      </div>
    </template>
  </USlideover>
</template>

<style scoped></style>
