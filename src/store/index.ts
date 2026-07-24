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
  };
});
