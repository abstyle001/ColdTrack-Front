import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { TokenClaim, User } from "../utils/types";

export async function getTokenClaimRequest() {
  const [_, data] = await request<TokenClaim>("/account/me", "GET", {
    token: token.value,
  });
  return data;
}

export async function createUserRequest(user: Partial<User> & { email: string; password: string }, avatar: File | null) {
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
