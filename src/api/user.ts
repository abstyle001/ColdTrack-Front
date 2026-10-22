import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { User, UserBrief, UserPositionView } from "../utils/types";

export async function fetchUserPageRequest(pageNumber: number, pageSize: number) {
  const [_, data] = await request<User[]>("/user/page", "GET", {
    token: token.value,
    body: {
      number: pageNumber,
      size: pageSize,
    },
  });
  return data;
}

export async function fetchUserListRequest() {
  const [err, data] = await request<User[]>("/user/list", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function getUserInfoRequest(id: string) {
  const [_, data] = await request<User>(`/user/${id}`, "GET", {
    token: token.value,
  });
  return data;
}

export async function deleteUserBatchRequest(ids: string[]) {
  const [err, _] = await request<void>("/user/batch", "DELETE", {
    token: token.value,
    body: ids,
  });
  return err;
}

export async function updateUserRequest(user: User, avatar: File | null) {
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

export async function fetchUserBriefRequest(includeAdmin: boolean = false) {
  const [err, data] = await request<UserBrief[]>(`/user/brief?includeAdmin=${includeAdmin}`, "GET", {
    token: token.value,
  });
  return err ? null : data;
}

// ============ 用户分配职位 UserPosition ============
export async function assignUserPositionRequest(userId: string, positionId: number) {
  const [err, _] = await request<void>("/user/userposition", "POST", {
    token: token.value,
    body: { userId, positionId },
  });
  return err;
}

export async function removeUserPositionRequest(userId: string, positionId: number) {
  const [err, _] = await request<void>("/user/userposition", "DELETE", {
    token: token.value,
    body: { userId, positionId },
  });
  return err;
}

export async function fetchUserPositionsRequest(userId: string) {
  const [err, data] = await request<UserPositionView[]>(
    `/user/userposition/user/${userId}`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}

export async function fetchUsersByPositionRequest(positionId: number) {
  const [err, data] = await request<User[]>(
    `/user/userposition/position/${positionId}/users`,
    "GET",
    { token: token.value }
  );
  return err ? null : data;
}
