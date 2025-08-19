<template>
  <div
    class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d] p-4 relative overflow-hidden">
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_30%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.05)_0%,transparent_30%)]">
    </div>
    <UCard
      class="w-full max-w-md rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] overflow-hidden relative z-10 backdrop-blur-sm transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div class="p-[35px_30px_20px] text-center">
        <div class="flex items-center justify-center mb-6 space-x-4">
          <UIcon name="i-lucide-lightbulb" class="size-5" />
          <h1 class="text-[26px] font-bold bg-gradient-to-r from-[#409eff] to-[#66b1ff] bg-clip-text text-transparent">
            ColdTrack Login</h1>
        </div>
        <h2 class="text-[24px] font-semibold text-[#303133] mb-2">欢迎回来</h2>
        <p class="text-[14px] text-[#606266]/90">请输入您的账号信息登录</p>
      </div>
      <UForm :schema="schema" :state="state" class="flex flex-col items-center space-y-4" @submit="onSubmit">
        <UFormField label="用户名或邮箱" name="email">
          <UInput v-model="state.email">
            <template #trailing></template>
          </UInput>
        </UFormField>

        <UFormField label="密码" name="password">
          <UInput v-model="state.password" :type="show ? 'text' : 'password'" :ui="{ trailing: 'pe-1' }">
            <template #trailing>
              <UButton color="neutral" variant="link" size="sm" :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="show ? 'Hide password' : 'Show password'" :aria-pressed="show" aria-controls="password"
                @click="show = !show" />
            </template>
          </UInput>
        </UFormField>

        <UButton type="submit" :loading="loading" class="w-1/3 flex justify-center items-center">
          登录
        </UButton>
      </UForm>
    </UCard>

    <!-- 页脚信息 -->
    <footer class="mt-8 text-white/70 text-xs text-center z-10">
      <p>© 2025 ColdTrack. 保留所有权利</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import request from '../utils/request';
import { loginStatus, token } from '../utils/useStorage';
import { useRouter } from 'vue-router';
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui'

const router = useRouter();
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
      title: '哦天哪，登录失败',
      description: err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    })
    return;
  }
  toast.add({
    title: '可恶，居然被你登录成功了',
    description: '登录成功，正在跳转...',
    icon: 'i-material-symbols-light:rocket-launch-rounded'
  })
  token.value = data;
  loginStatus.value = true;
  loading.value = false;
  setTimeout(() => {
    router.replace('/');
  }, 2000);
}
</script>

<style scoped></style>
