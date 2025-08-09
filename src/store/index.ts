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

  const updateUser = (newUser: User) => {
    user.value = { ...user.value, ...newUser };
  };
  return { user, updateUser };
});
