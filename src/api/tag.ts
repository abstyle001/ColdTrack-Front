import { token } from "../utils/useStorage";
import request from "../utils/request";
import type { Tag } from "../utils/types";

export async function fetchTagListRequest() {
  const [err, data] = await request<Tag[]>("/tag", "GET", {
    token: token.value,
  });
  return err ? null : data;
}

export async function createTagRequest(tag: { name: string; color?: string }) {
  const [err, data] = await request<Tag>("/tag", "POST", {
    token: token.value,
    body: tag,
  });
  return { err, data };
}

export async function updateTagRequest(id: number, tag: { name?: string; color?: string }) {
  const [err, data] = await request<Tag>(`/tag/${id}`, "PUT", {
    token: token.value,
    body: tag,
  });
  return { err, data };
}

export async function deleteTagRequest(id: number) {
  const [err] = await request<void>(`/tag/${id}`, "DELETE", {
    token: token.value,
  });
  return err;
}
