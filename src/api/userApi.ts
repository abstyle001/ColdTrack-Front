import { token } from "../utils/useStorage";
import request from "../utils/request";
import type {
  TokenClaim,
  User,
  Department,
  DepartmentTree,
  Position,
  UserPositionView,
  Permission,
  Role,
  UserBrief,
  Task,
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

// ============ 部门分页 ============
async function fetchDepartmentPageRequest(pageNumber: number, pageSize: number) {
  const [err, data] = await request<Department[]>("/department/page", "GET", {
    token: token.value,
    body: {
      number: pageNumber,
      size: pageSize,
    },
  });
  return err ? null : data;
}

async function fetchDepartmentCountRequest() {
  const [err, data] = await request<number>("/department/count", "GET", {
    token: token.value,
  });
  return err ? null : data;
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

// ============ 职位分页 ============
async function fetchPositionPageRequest(pageNumber: number, pageSize: number) {
  const [err, data] = await request<Position[]>("/position/page", "GET", {
    token: token.value,
    body: {
      number: pageNumber,
      size: pageSize,
    },
  });
  return err ? null : data;
}

async function fetchPositionCountRequest() {
  const [err, data] = await request<number>("/position/count", "GET", {
    token: token.value,
  });
  return err ? null : data;
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

// ============ 角色与权限管理 ============
async function fetchPermissionsCatalogRequest() {
  const [err, data] = await request<Permission[]>("/role/permissions", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function fetchRolesRequest() {
  const [err, data] = await request<Role[]>("/role", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function createRoleRequest(name: string) {
  const [err, data] = await request<Role>("/role", "POST", {
    token: token.value,
    body: { name },
  });
  return { err, data };
}

async function updateRolePermissionsRequest(roleId: string, permissionKeys: string[]) {
  const [err, _] = await request<void>(`/role/${roleId}/permissions`, "PUT", {
    token: token.value,
    body: { permissionKeys },
  });
  return err;
}

async function addUserToRoleRequest(roleId: string, userId: string) {
  const [err, _] = await request<void>(`/role/${roleId}/users/${userId}`, "POST", {
    token: token.value,
  });
  return err;
}

async function removeUserFromRoleRequest(roleId: string, userId: string) {
  const [err, _] = await request<void>(`/role/${roleId}/users/${userId}`, "DELETE", {
    token: token.value,
  });
  return err;
}

async function fetchRoleUsersRequest(roleId: string) {
  const [err, data] = await request<User[]>(`/role/${roleId}/users`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function fetchUserRolesRequest(userId: string) {
  const [err, data] = await request<Role[]>(`/role/user/${userId}/roles`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

// ============ 任务 Task ============
async function fetchTaskListRequest() {
  const [err, data] = await request<Task[]>("/task", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function getTaskRequest(id: number) {
  const [err, data] = await request<Task>(`/task/${id}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

async function fetchTaskPageRequest(pageNumber: number, pageSize: number, status?: string, priority?: string) {
  const params: Record<string, string | number> = {
    number: pageNumber,
    size: pageSize,
  };
  if (status) params.status = status;
  if (priority) params.priority = priority;
  const [err, data] = await request<Task[]>("/task/page", "GET", {
    token: token.value,
    body: params,
  });
  return err ? null : data;
}

async function fetchTaskCountRequest(status?: string, priority?: string) {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (priority) params.priority = priority;
  const [err, data] = await request<number>("/task/count", "GET", {
    token: token.value,
    body: params,
  });
  return err ? null : data;
}

async function createTaskRequest(task: Partial<Task>) {
  const [err, data] = await request<Task>("/task", "POST", {
    token: token.value,
    body: {
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
      priority: task.priority,
      deadline: task.deadline,
    },
  });
  return { err, data };
}

async function updateTaskRequest(task: Partial<Task>) {
  const [err, data] = await request<Task>(`/task/${task.id}`, "PUT", {
    token: token.value,
    body: {
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
    },
  });
  return { err, data };
}

async function deleteTaskRequest(id: number) {
  const [err, _] = await request<void>(`/task/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}

async function deleteTaskBatchRequest(ids: number[]) {
  const [err, _] = await request<void>("/task/batch", "DELETE", {
    token: token.value,
    body: ids,
  });
  return err;
}


async function fetchUserBriefRequest(includeAdmin: boolean = false) {
  const [err, data] = await request<UserBrief[]>(`/user/brief?includeAdmin=${includeAdmin}`, "GET", {
    token: token.value,
  });
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
  fetchDepartmentPageRequest,
  fetchDepartmentCountRequest,
  fetchPositionListRequest,
  getPositionRequest,
  createPositionRequest,
  updatePositionRequest,
  deletePositionRequest,
  fetchPositionPageRequest,
  fetchPositionCountRequest,
  assignPositionDepartmentRequest,
  removePositionDepartmentRequest,
  fetchPositionsByDepartmentRequest,
  fetchDepartmentsByPositionRequest,
  assignUserPositionRequest,
  removeUserPositionRequest,
  fetchUserPositionsRequest,
  fetchUsersByPositionRequest,
  fetchPermissionsCatalogRequest,
  fetchRolesRequest,
  createRoleRequest,
  updateRolePermissionsRequest,
  addUserToRoleRequest,
  removeUserFromRoleRequest,
  fetchRoleUsersRequest,
  fetchUserRolesRequest,
  fetchTaskListRequest,
  getTaskRequest,
  fetchTaskPageRequest,
  fetchTaskCountRequest,
  createTaskRequest,
  updateTaskRequest,
  deleteTaskRequest,
  deleteTaskBatchRequest,
  fetchUserBriefRequest,
};
