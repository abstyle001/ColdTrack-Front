import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { Task, TaskComment, TaskStats } from "../utils/types";

export async function fetchTaskListRequest(projectId?: number) {
  const params: Record<string, number> = {};
  if (projectId) params.projectId = projectId;
  const [err, data] = await request<Task[]>("/task", "GET", {
    token: token.value,
    body: params,
  });
  return err ? null : data;
}

export async function getTaskRequest(id: number) {
  const [err, data] = await request<Task>(`/task/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function fetchTaskPageRequest(pageNumber: number, pageSize: number, assigneeId?: string, status?: string, priority?: string, tagId?: string, projectId?: number) {
  const params: Record<string, string | number> = {
    number: pageNumber,
    size: pageSize,
  };
  if (assigneeId) params.assigneeId = assigneeId;
  if (status) params.status = status;
  if (priority) params.priority = priority;
  if (tagId) params.tagId = tagId;
  if (projectId) params.projectId = projectId;
  const [err, data] = await request<Task[]>("/task/page", "GET", {
    token: token.value,
    body: params,
  });
  return err ? null : data;
}

export async function fetchTaskCountRequest(assigneeId?: string, status?: string, priority?: string, tagId?: string, projectId?: number) {
  const params: Record<string, string | number> = {};
  if (assigneeId) params.assigneeId = assigneeId;
  if (status) params.status = status;
  if (priority) params.priority = priority;
  if (tagId) params.tagId = tagId;
  if (projectId) params.projectId = projectId;
  const [err, data] = await request<number>("/task/count", "GET", {
    token: token.value,
    body: params,
  });
  return err ? null : data;
}

export async function createTaskRequest(task: Partial<Task> & { tagIds?: number[] }) {
  const [err, data] = await request<Task>("/task", "POST", {
    token: token.value,
    body: {
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      priority: task.priority,
      deadline: task.deadline,
      tagIds: task.tagIds,
    },
  });
  return { err, data };
}

export async function updateTaskRequest(task: Partial<Task> & { tagIds?: number[] }) {
  const [err, data] = await request<Task>(`/task/${task.id}`, "PUT", {
    token: token.value,
    body: {
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      tagIds: task.tagIds,
    },
  });
  return { err, data };
}

export async function deleteTaskRequest(id: number) {
  const [err, _] = await request<void>(`/task/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}

export async function deleteTaskBatchRequest(ids: number[]) {
  const [err, _] = await request<void>("/task/batch", "DELETE", {
    token: token.value,
    body: ids,
  });
  return err;
}

export async function updateTaskStatusRequest(id: number, status: string) {
  const [err, data] = await request<Task>(`/task/${id}/status`, "PATCH", {
    token: token.value,
    body: { status },
  });
  return { err, data };
}

export async function updateTaskStatusBatchRequest(ids: number[], status: string) {
  const [err, data] = await request<Task[]>("/task/batch/status", "PATCH", {
    token: token.value,
    body: { ids, status },
  });
  return { err, data };
}

export async function fetchTaskStatsRequest() {
  const [err, data] = await request<TaskStats>("/task/stats", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

// ============ 任务评论 TaskComment ============
export async function fetchTaskCommentsRequest(taskId: number) {
  const [err, data] = await request<TaskComment[]>(`/task/${taskId}/comments`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function createTaskCommentRequest(taskId: number, content: string) {
  const [err, data] = await request<TaskComment>(`/task/${taskId}/comments`, "POST", {
    token: token.value,
    body: { content },
  });
  return { err, data };
}
