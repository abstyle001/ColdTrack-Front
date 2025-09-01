<template>
  <DashboardPanel title="个人信息">
    <UPageCard title="个人信息">
      <div class="flex w-full justify-between">
        <UUser :name="userStore.user.nickName" :description="`<${userStore.user.userName}>`" :avatar="avatar" />
        <UModal v-model:open="open" title="头像更改">
          <UButton icon="i-lucide-upload">修改头像</UButton>
          <template #body>
            <div class="flex flex-col justify-center items-center gap-3">
              <UFileUpload v-model="avatarValue" label="将您的图像放在此处" description="SVG, PNG, JPG or GIF (max. 2MB)"
                class="w-96 min-h-48" />
              <UButton @click="upload">上传</UButton>
            </div>
          </template>
        </UModal>
      </div>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="邮箱" name="email">
          <UInput v-model="state.email" disabled />
        </UFormField>
        <UFormField label="用户名" name="userName">
          <UInput v-model="state.userName" disabled />
        </UFormField>
        <UFormField label="姓名" name="nickName">
          <UInput v-model="state.nickName" />
        </UFormField>
        <UFormField label="城市" name="city">
          <UInput v-model="state.city" />
        </UFormField>
        <UFormField label="联系方式" name="phone">
          <UInput v-model="state.phone" />
        </UFormField>
        <UButton type="submit">
          提交
        </UButton>
      </UForm>
    </UPageCard>
  </DashboardPanel>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useUserStore } from '../store';
import { updateUserRequest } from '../api/userApi';
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { User } from '../utils/types';

const schema = z.object({
  email: z.string().email('无效的邮箱地址'),
  userName: z.string().min(3, '用户名至少三个字符').max(20, '用户名不能超过20个字符'),
  nickName: z.string().min(1, '姓名不能为空').max(30, '姓名不能超过30个字符'),
  city: z.string().max(50, '城市名称不能超过50个字符').optional(),
  phone: z.string().max(11, '电话号码不能超过11个字符').optional()
})

type Schema = z.output<typeof schema>

const toast = useToast();
const userStore = useUserStore()

const state = reactive<Partial<Schema>>({
  email: undefined,
  userName: undefined,
  nickName: undefined,
  city: undefined,
  phone: undefined
})

const open = ref(false);
const avatarValue = ref<null | File>(null);

const avatar = computed(() => ({
  src: userStore.user.avatar + '?v=' + userStore.avatarVersion,
  icon: 'i-lucide-image'
}))

async function upload() {
  if (avatarValue.value === null) {
    toast.add({
      title: '校验错误',
      description: '请先选择一个文件再上传',
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'warning'
    })
    return;
  }
  const { err } = await updateUserRequest(userStore.user, avatarValue.value);
  if (err) {
    toast.add({
      title: '哦天哪，上传失败',
      description: err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    })
    return;
  }
  toast.add({
    title: '可恶，上传成功',
    description: '您的头像上传成功',
    icon: 'i-material-symbols-light:rocket-launch-rounded'
  });
  avatarValue.value = null;
  open.value = false;
  userStore.incrementAvatarVersion();
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)
  const user: User = {
    id: userStore.user.id,
    email: event.data.email,
    userName: event.data.userName,
    nickName: event.data.nickName,
    city: event.data.city,
    phone: event.data.phone,
    avatar: userStore.user.avatar,
    createdAt: ''
  }
  const {err, data} = await updateUserRequest(user, null);
  if (err) {
    toast.add({
      title: '哦天哪，更新失败',
      description: err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    })
    return;
  }
  if (data) {
    userStore.updateUser(data);
    toast.add({
      title: '可恶，更新成功',
      description: '您的个人信息更新成功',
      icon: 'i-material-symbols-light:rocket-launch-rounded'
    });
  }
}

watch(() => userStore.user,
  (user) => {
    state.email = user.email;
    state.userName = user.userName;
    state.nickName = user.nickName;
    state.city = user.city;
    state.phone = user.phone;
  }, { immediate: true, deep: true });
</script>

<style scoped></style>