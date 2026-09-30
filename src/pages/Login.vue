<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gray-950 p-4 relative overflow-hidden">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

    <div class="w-full max-w-md relative z-10">
      <div class="text-center mb-8">
        <UIcon name="i-lucide-briefcase" class="size-10 text-(--ui-primary) mx-auto mb-4" />
        <h1 class="text-2xl font-semibold text-white">ColdTrack</h1>
        <p class="text-sm text-gray-400 mt-2">{{ t('login.subtitle') }}</p>
      </div>

      <UCard class="shadow-xl">
        <UForm :schema="schema" :state="state" class="flex flex-col gap-5" @submit="onSubmit">
          <UFormField :label="t('login.form.email')" name="email">
            <UInput v-model="state.email" :placeholder="t('login.form.emailPlaceholder')" size="lg" class="w-full" />
          </UFormField>

          <UFormField :label="t('login.form.password')" name="password">
            <UInput
              v-model="state.password"
              :type="show ? 'text' : 'password'"
              :placeholder="t('login.form.passwordPlaceholder')"
              size="lg"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="show ? t('login.form.hidePassword') : t('login.form.showPassword')"
                  @click="show = !show"
                />
              </template>
            </UInput>
          </UFormField>

          <UButton type="submit" :loading="loading" block size="lg">
            {{ t('login.form.submit') }}
          </UButton>
        </UForm>
      </UCard>
    </div>

    <footer class="mt-8 text-gray-500 text-xs text-center relative z-10">
      <p>&copy; 2025 ColdTrack. {{ t('login.footer') }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

function buildSchema() {
  return z.object({
    email: z.string().email(t('login.validation.emailInvalid')),
    password: z.string().min(6, t('login.validation.passwordMin'))
  });
}

const schema = computed(buildSchema);

type Schema = z.output<ReturnType<typeof buildSchema>>
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
      title: t('login.toast.loginFailed'),
      description: err,
      icon: 'i-lucide-circle-x',
      color: 'error'
    })
    return;
  }
  toast.add({
    title: t('login.toast.loginSuccess'),
    description: t('login.toast.redirecting'),
    icon: 'i-lucide-rocket'
  })
  token.value = data;
  loginStatus.value = true;
  loading.value = false;
  // 先清掉可能残留的上一个账号状态，再写入当前账号信息
  userStore.reset();
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
