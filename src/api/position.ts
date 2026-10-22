import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { Department, Position } from "../utils/types";

export async function fetchPositionListRequest() {
  const [err, data] = await request<Position[]>("/position", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function getPositionRequest(id: number) {
  const [err, data] = await request<Position>(`/position/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function createPositionRequest(position: Partial<Position>) {
  const [err, data] = await request<Position>("/position", "POST", {
    token: token.value,
    body: {
      name: position.name,
      duty: position.duty,
      workspace: position.workspace,
      addition: position.addition,
    },
  });
  return { err, data };
}

export async function updatePositionRequest(position: Partial<Position>) {
  const [err, data] = await request<Position>(`/position/${position.id}`, "PUT", {
    token: token.value,
    body: {
      name: position.name,
      duty: position.duty,
      workspace: position.workspace,
      addition: position.addition,
    },
  });
  return { err, data };
}

export async function deletePositionRequest(id: number) {
  const [err, _] = await request<void>(`/position/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}

// ============ 职位分页 ============
export async function fetchPositionPageRequest(pageNumber: number, pageSize: number) {
  const [err, data] = await request<Position[]>("/position/page", "GET", {
    token: token.value,
    body: {
      number: pageNumber,
      size: pageSize,
    },
  });
  return err ? null : data;
}

export async function fetchPositionCountRequest() {
  const [err, data] = await request<number>("/position/count", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

// ============ 职位归属部门 PositionDepartment ============
export async function assignPositionDepartmentRequest(positionId: number, departmentId: string) {
  const [err, _] = await request<void>("/positiondepartment", "POST", {
    token: token.value,
    body: { positionId, departmentId },
  });
  return err;
}

export async function removePositionDepartmentRequest(positionId: number, departmentId: string) {
  const [err, _] = await request<void>("/positiondepartment", "DELETE", {
    token: token.value,
    body: { positionId, departmentId },
  });
  return err;
}

export async function fetchPositionsByDepartmentRequest(departmentId: string) {
  const [err, data] = await request<Position[]>(
    `/positiondepartment/department/${departmentId}/positions`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}

export async function fetchDepartmentsByPositionRequest(positionId: number) {
  const [err, data] = await request<Department[]>(
    `/positiondepartment/position/${positionId}/departments`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}
