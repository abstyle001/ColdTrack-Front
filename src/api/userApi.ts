import { token } from "../hooks/useStorage";
import request from "../utils/request";
import type { User } from "../utils/types";

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

export { fetchUserPageRequest };
