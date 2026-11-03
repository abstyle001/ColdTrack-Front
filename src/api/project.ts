import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { CreateProjectPayload, Project, UpdateProjectPayload } from "../utils/types";

export async function fetchProjectListRequest(params?: { status?: string; managerId?: string; keyword?: string }) {
  const [err, data] = await request<Project[]>("/project", "GET", {
    token: token.value,
    body: params,
  });
  return err ? null : data;
}

export async function fetchProjectDetailRequest(id: number) {
  const [err, data] = await request<Project>(`/project/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function createProjectRequest(payload: CreateProjectPayload) {
  const [err, data] = await request<Project>("/project", "POST", {
    token: token.value,
    body: {
      name: payload.name,
      description: payload.description,
      managerId: payload.managerId,
      status: payload.status,
      startDate: payload.startDate,
      endDate: payload.endDate,
      memberIds: payload.memberIds,
    },
  });
  return { err, data };
}

export async function updateProjectRequest(id: number, payload: UpdateProjectPayload) {
  const [err, data] = await request<Project>(`/project/${id}`, "PUT", {
    token: token.value,
    body: payload,
  });
  return { err, data };
}

export async function deleteProjectRequest(id: number) {
  const [err, _] = await request<void>(`/project/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}
