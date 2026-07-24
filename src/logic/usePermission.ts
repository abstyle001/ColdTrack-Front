import { computed } from "vue";
import { useUserStore } from "../store";

/*
 * 权限组合式函数：基于 userStore 中的权限列表，提供响应式的 can() 判断。
 * 服务端 [HasPermission] 才是安全边界，此处仅用于界面显隐。
 */
export function usePermission() {
  const store = useUserStore();

  const can = (key: string): boolean => store.hasPermission(key);
  const canAdmin = computed(() => store.isAdmin());
  const refresh = () => {
    // 权限存储在 Pinia 中是响应式的，登录后由 UserMenu 写入即可，无需额外操作
  };

  return { can, canAdmin, refresh };
}
