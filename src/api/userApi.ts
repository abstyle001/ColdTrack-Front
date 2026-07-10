import { token } from "../utils/useStorage";
import request from "../utils/request";
import type {
  TokenClaim,
  User,
  Department,
  DepartmentTree,
  Position,
  UserPositionView,
} from "../utils/types";

async function fetchUserPageRequest(pageNumber: number, pageSize: number) {
  const [_, data] = await request<User[]>("/user/page", "GET", {
    token: token.value,
    body: {
      number: pageNumber,
      size: pageSize,
    },
  });
  return data;
}

async function fetchUserListRequest() {
  const [err, data] = await request<User[]>("/user/list", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function getTokenClaimRequest() {
  const [_, data] = await request<TokenClaim>("/account/me", "GET", {
    token: token.value,
  });
  return data;
}

async function getUserInfoRequest(id: string) {
  const [_, data] = await request<User>(`/user/${id}`, "GET", {
    token: token.value,
  });
  return data;
}

async function deleteUserBatchRequest(ids: string[]) {
  const [err, _] = await request<void>("/user/batch", "DELETE", {
    token: token.value,
    body: ids,
  });
  return err;
}

async function createUserRequest(user: Partial<User> & { email: string; password: string }, avatar: File | null) {
  const formData = new FormData();
  formData.append("email", user.email);
  formData.append("password", user.password);
  formData.append("nickName", user.nickName ?? '');
  formData.append("city", user.city ?? '');
  formData.append("phone", user.phone ?? '');
  if (avatar) {
    formData.append("file", avatar);
  }
  const [err, data] = await request<User>("/account/register", "POST", {
    token: token.value,
    body: formData,
  });
  return { err, data };
}

async function updateUserRequest(user: User, avatar: File | null) {
  const formData = new FormData();
  formData.append("nickName", user.nickName);
  formData.append("city", user.city ?? '');
  formData.append("phone", user.phone ?? '');
  if (avatar) {
    formData.append("file", avatar);
  }
  const [err, data] = await request<User>(`/user/${user.id}`, "PUT", {
    token: token.value,
    body: formData,
  });
  return { err, data };
}

// ============ 部门 Department ============
async function fetchDepartmentListRequest() {
  const [err, data] = await request<Department[]>("/department", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function fetchDepartmentTreeRequest() {
  const [err, data] = await request<DepartmentTree[]>("/department/tree", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function getDepartmentRequest(id: string) {
  const [err, data] = await request<Department>(`/department/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function createDepartmentRequest(department: Partial<Department>) {
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

async function updateDepartmentRequest(department: Partial<Department>) {
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

async function deleteDepartmentRequest(id: string) {
  const [err, _] = await request<void>(`/department/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}

// ============ 职位 Position ============
async function fetchPositionListRequest() {
  const [err, data] = await request<Position[]>("/position", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function getPositionRequest(id: number) {
  const [err, data] = await request<Position>(`/position/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function createPositionRequest(position: Partial<Position>) {
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

async function updatePositionRequest(position: Partial<Position>) {
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

async function deletePositionRequest(id: number) {
  const [err, _] = await request<void>(`/position/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}

// ============ 职位归属部门 PositionDepartment ============
async function assignPositionDepartmentRequest(positionId: number, departmentId: string) {
  const [err, _] = await request<void>("/positiondepartment", "POST", {
    token: token.value,
    body: { positionId, departmentId },
  });
  return err;
}

async function removePositionDepartmentRequest(positionId: number, departmentId: string) {
  const [err, _] = await request<void>("/positiondepartment", "DELETE", {
    token: token.value,
    body: { positionId, departmentId },
  });
  return err;
}

async function fetchPositionsByDepartmentRequest(departmentId: string) {
  const [err, data] = await request<Position[]>(
    `/positiondepartment/department/${departmentId}/positions`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}

async function fetchDepartmentsByPositionRequest(positionId: number) {
  const [err, data] = await request<Department[]>(
    `/positiondepartment/position/${positionId}/departments`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}

// ============ 用户分配职位 UserPosition ============
async function assignUserPositionRequest(userId: string, positionId: number) {
  const [err, _] = await request<void>("/user/userposition", "POST", {
    token: token.value,
    body: { userId, positionId },
  });
  return err;
}

async function removeUserPositionRequest(userId: string, positionId: number) {
  const [err, _] = await request<void>("/user/userposition", "DELETE", {
    token: token.value,
    body: { userId, positionId },
  });
  return err;
}

async function fetchUserPositionsRequest(userId: string) {
  const [err, data] = await request<UserPositionView[]>(
    `/user/userposition/user/${userId}`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}

async function fetchUsersByPositionRequest(positionId: number) {
  const [err, data] = await request<User[]>(
    `/user/userposition/position/${positionId}/users`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}

export {
  fetchUserPageRequest,
  fetchUserListRequest,
  getUserInfoRequest,
  getTokenClaimRequest,
  deleteUserBatchRequest,
  createUserRequest,
  updateUserRequest,
  fetchDepartmentListRequest,
  fetchDepartmentTreeRequest,
  getDepartmentRequest,
  createDepartmentRequest,
  updateDepartmentRequest,
  deleteDepartmentRequest,
  fetchPositionListRequest,
  getPositionRequest,
  createPositionRequest,
  updatePositionRequest,
  deletePositionRequest,
  assignPositionDepartmentRequest,
  removePositionDepartmentRequest,
  fetchPositionsByDepartmentRequest,
  fetchDepartmentsByPositionRequest,
  assignUserPositionRequest,
  removeUserPositionRequest,
  fetchUserPositionsRequest,
  fetchUsersByPositionRequest,
};
