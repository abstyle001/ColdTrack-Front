import { defineStore } from "pinia";
import { ref } from "vue";
import type { User } from "../utils/types";

export const useUserStore = defineStore("user", () => {
  const user = ref<User>({
    id: "",
    userName: "",
    email: "",
    nickName: "",
    phone: "",
    city: "",
    createdAt: "",
    avatar: "",
  });
  const avatarVersion = ref(0);
  const permissions = ref<string[]>([]);
  const roles = ref<string[]>([]);

  const updateUser = (newUser: User) => {
    user.value = { ...user.value, ...newUser };
  };
  const incrementAvatarVersion = () => {
    avatarVersion.value++;
  };
  const setPermissions = (perms: string[], roleList: string[]) => {
    permissions.value = perms ?? [];
    roles.value = roleList ?? [];
  };
  const hasPermission = (key: string) => permissions.value.includes(key);
  const hasRole = (role: string) => roles.value.includes(role);
  const isAdmin = () => roles.value.includes("Admin");
  // 退出登录/切换账号时清空，避免残留上一个账号的信息与权限
  const reset = () => {
    user.value = {
      id: "",
      userName: "",
      email: "",
      nickName: "",
      phone: "",
      city: "",
      createdAt: "",
      avatar: "",
    };
    permissions.value = [];
    roles.value = [];
  };
  return {
    user,
    avatarVersion,
    permissions,
    roles,
    updateUser,
    incrementAvatarVersion,
    setPermissions,
    hasPermission,
    hasRole,
    isAdmin,
    reset,
  };
});
