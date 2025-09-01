import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { TokenClaim, User } from "../utils/types";

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

export {
  fetchUserPageRequest,
  getUserInfoRequest,
  getTokenClaimRequest,
  deleteUserBatchRequest,
  updateUserRequest,
};
