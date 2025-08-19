import axios, {
  AxiosError,
  type AxiosResponse,
} from "axios";
import { Status } from "./types";

const API_BASE_URL = "/api";

export type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Options {
  token?: string;
  body?: object | FormData | null;
}

async function request<T>(
  url: string,
  method: Method = "GET",
  options: Options = {}
): Promise<[err: string | null, data: T | null]> {
  let ultimaUrl = API_BASE_URL;
  let headers = null;
  let body = null;
  const bearerToken = options.token ? `Bearer ${options.token}` : null;
  headers = {
    "Content-Type": "application/json",
    Authorization: bearerToken,
  };
  if (typeof options.body === "object") {
    body = options.body;
  }
  if (options.body instanceof FormData) {
    body = options.body;
    headers = {
      Authorization: bearerToken,
    };
  }
  try {
    ultimaUrl = `${ultimaUrl}${url}`;
    let response: AxiosResponse;
    if (method === "GET") {
      if (options.body && typeof options.body === "object") {
        const params = new URLSearchParams();
        Object.entries(options.body).forEach(([key, value]) => {
          if (value != undefined) {
            params.append(key, value.toString());
          }
        });
        ultimaUrl += "?" + params.toString();
      }
      response = await axios.get(ultimaUrl, {
        method: "GET",
        headers,
      });
      if (response.status === Status.OK) {
        return [null, response.data as T];
      }
    } else {
      response = await axios({
        url: ultimaUrl,
        method,
        headers,
        data: body,
      });
      if (response.status === Status.OK) {
        return [null, response.data as T];
      }
    }
    return ["服务器错误", null];
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError && error.response?.status === Status.UN_AUTHORIZED) {
      return ["请先登录", null];
    }
    if (error instanceof AxiosError && error.response?.status === Status.FORBIDDEN) {
      return ["没有权限", null];
    }
    return [
      error instanceof AxiosError ? error.response?.data : "服务器错误",
      null,
    ];
  }
}

export default request;
