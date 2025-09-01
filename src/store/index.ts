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
  const updateUser = (newUser: User) => {
    user.value = { ...user.value, ...newUser };
  };
  const incrementAvatarVersion = () => {
    avatarVersion.value++;
  }
  return { user, updateUser, avatarVersion, incrementAvatarVersion };
});
