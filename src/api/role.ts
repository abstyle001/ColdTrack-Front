import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { Permission, Role, User } from "../utils/types";

export async function fetchPermissionsCatalogRequest() {
  const [err, data] = await request<Permission[]>("/role/permissions", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function fetchRolesRequest() {
  const [err, data] = await request<Role[]>("/role", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function createRoleRequest(name: string) {
  const [err, data] = await request<Role>("/role", "POST", {
    token: token.value,
    body: { name },
  });
  return { err, data };
}

export async function updateRolePermissionsRequest(roleId: string, permissionKeys: string[]) {
  const [err, _] = await request<void>(`/role/${roleId}/permissions`, "PUT", {
    token: token.value,
    body: { permissionKeys },
  });
  return err;
}

export async function addUserToRoleRequest(roleId: string, userId: string) {
  const [err, _] = await request<void>(`/role/${roleId}/users/${userId}`, "POST", {
    token: token.value,
  });
  return err;
}

export async function removeUserFromRoleRequest(roleId: string, userId: string) {
  const [err, _] = await request<void>(`/role/${roleId}/users/${userId}`, "DELETE", {
    token: token.value,
  });
  return err;
}

export async function fetchRoleUsersRequest(roleId: string) {
  const [err, data] = await request<User[]>(`/role/${roleId}/users`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function fetchUserRolesRequest(userId: string) {
  const [err, data] = await request<Role[]>(`/role/user/${userId}/roles`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}
