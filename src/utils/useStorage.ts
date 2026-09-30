import { useLocalStorage } from "@vueuse/core";

export const token = useLocalStorage('token', '');

export const loginStatus = useLocalStorage('login_status', false);

export const locale = useLocalStorage<'zh-CN' | 'en-US'>('locale', 'zh-CN');