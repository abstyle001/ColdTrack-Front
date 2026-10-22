import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { Department, DepartmentTree } from "../utils/types";

export async function fetchDepartmentListRequest() {
  const [err, data] = await request<Department[]>("/department", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function fetchDepartmentTreeRequest() {
  const [err, data] = await request<DepartmentTree[]>("/department/tree", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function getDepartmentRequest(id: string) {
  const [err, data] = await request<Department>(`/department/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function createDepartmentRequest(department: Partial<Department>) {
  const [err, data] = await request<Department>("/department", "POST", {
    token: token.value,
    body: {
      name: department.name,
      parentId: department.parentId || "",
      explain: department.explain,
      managerId: department.managerId,
      workspace: department.workspace,
      addition: department.addition,
    },
  });
  return { err, data };
}

export async function updateDepartmentRequest(department: Partial<Department>) {
  const [err, data] = await request<Department>(`/department/${department.id}`, "PUT", {
    token: token.value,
    body: {
      id: department.id,
      name: department.name,
      parentId: department.parentId,
      level: department.level,
      explain: department.explain,
      managerId: department.managerId,
      workspace: department.workspace,
      addition: department.addition,
    },
  });
  return { err, data };
}

export async function deleteDepartmentRequest(id: string) {
  const [err, _] = await request<void>(`/department/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}

// ============ 部门分页 ============
export async function fetchDepartmentPageRequest(pageNumber: number, pageSize: number) {
  const [err, data] = await request<Department[]>("/department/page", "GET", {
    token: token.value,
    body: {
      number: pageNumber,
      size: pageSize,
    },
  });
  return err ? null : data;
}

export async function fetchDepartmentCountRequest() {
  const [err, data] = await request<number>("/department/count", "GET", {
    token: token.value,
  });
  return err ? null : data;
}
