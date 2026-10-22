import axios, {
  AxiosError,
  type AxiosResponse,
} from "axios";
import { Status } from "./types";
import { i18n } from "../i18n";
import router from "../router";
import { loginStatus, token } from "./useStorage";

const t = i18n.global.t;

const API_BASE_URL = "/api";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Options {
  token?: string;
  body?: object | FormData | null;
}

const http = axios.create();

// 响应拦截器：401 = 未认证（授权失败或 token 过期），清除本地登录态并跳转登录页
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === Status.UN_AUTHORIZED) {
      token.value = "";
      loginStatus.value = false;
      if (router.currentRoute.value.path !== "/login") {
        router.push("/login");
      }
    }
    return Promise.reject(error);
  }
);

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
      response = await http.get(ultimaUrl, {
        method: "GET",
        headers,
      });
      if (response.status === Status.OK) {
        return [null, response.data as T];
      }
    } else {
      response = await http({
        url: ultimaUrl,
        method,
        headers,
        data: body,
      });
      if (response.status === Status.OK) {
        return [null, response.data as T];
      }
    }
    return [t("api.serverError"), null];
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError && error.response?.status === Status.UN_AUTHORIZED) {
      return [t("api.unauthorized"), null];
    }
    if (error instanceof AxiosError && error.response?.status === Status.FORBIDDEN) {
      return [t("api.forbidden"), null];
    }
    return [
      error instanceof AxiosError ? error.response?.data : t("api.serverError"),
      null,
    ];
  }
}

export default request;
