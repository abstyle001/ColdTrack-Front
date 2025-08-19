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

export { fetchUserPageRequest, getUserInfoRequest, getTokenClaimRequest, deleteUserBatchRequest };
