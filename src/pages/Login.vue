<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gray-950 p-4 relative overflow-hidden">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

    <div class="w-full max-w-md relative z-10">
      <div class="text-center mb-8">
        <UIcon name="i-lucide-briefcase" class="size-10 text-(--ui-primary) mx-auto mb-4" />
        <h1 class="text-2xl font-semibold text-white">ColdTrack</h1>
        <p class="text-sm text-gray-400 mt-2">登录到您的账户</p>
      </div>

      <UCard class="shadow-xl">
        <UForm :schema="schema" :state="state" class="flex flex-col gap-5" @submit="onSubmit">
          <UFormField label="邮箱" name="email">
            <UInput v-model="state.email" placeholder="请输入邮箱" size="lg" class="w-full" />
          </UFormField>

          <UFormField label="密码" name="password">
            <UInput
              v-model="state.password"
              :type="show ? 'text' : 'password'"
              placeholder="请输入密码"
              size="lg"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="show ? 'Hide password' : 'Show password'"
                  @click="show = !show"
                />
              </template>
            </UInput>
          </UFormField>

          <UButton type="submit" :loading="loading" block size="lg">
            登录
          </UButton>
        </UForm>
      </UCard>
    </div>

    <footer class="mt-8 text-gray-500 text-xs text-center relative z-10">
      <p>&copy; 2025 ColdTrack. 保留所有权利</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import request from '../utils/request';
import { loginStatus, token } from '../utils/useStorage';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store';
import { getTokenClaimRequest } from '../api/userApi';
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui'

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const loading = ref(false);
const show = ref(false);

const schema = z.object({
  email: z.string().email('无效的电子邮件地址'),
  password: z.string().min(6, '必须至少包含 6 个字符')
});

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  const [err, data] = await request<string>('/account/login', 'POST', {
    body: {
      email: event.data.email,
      password: event.data.password,
    }
  });
  if (err) {
    loading.value = false;
    toast.add({
      title: '登录失败',
      description: err,
      icon: 'i-lucide-circle-x',
      color: 'error'
    })
    return;
  }
  toast.add({
    title: '登录成功',
    description: '正在跳转...',
    icon: 'i-lucide-rocket'
  })
  token.value = data;
  loginStatus.value = true;
  loading.value = false;
  const claim = await getTokenClaimRequest();
  if (claim) {
    userStore.setPermissions(claim.permissions, claim.roles);
  }
  setTimeout(() => {
    router.replace('/');
  }, 2000);
}
</script>

<style scoped></style>
