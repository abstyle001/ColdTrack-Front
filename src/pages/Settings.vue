<template>
  <DashboardPanel :title="t('settings.title')">
    <UPageCard :title="t('settings.profile.title')" :description="t('settings.profile.description')">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <UUser :name="userStore.user.nickName || t('settings.profile.noName')"
          :description="userStore.user.userName ? `@${userStore.user.userName}` : ''" :avatar="avatar" size="xl" />
        <div class="flex gap-2">
          <UModal v-model:open="avatarOpen" :title="t('settings.profile.avatarModalTitle')">
            <UButton icon="i-lucide-upload" color="neutral" variant="outline">
              {{ t('settings.profile.changeAvatar') }}
            </UButton>
            <template #body>
              <div class="flex flex-col justify-center items-center gap-3">
                <UFileUpload v-model="avatarFile" :label="t('settings.profile.avatarUploadLabel')"
                  :description="t('settings.profile.avatarUploadDescription')" class="w-96 min-h-48" />
                <UButton :loading="avatarUploading" @click="uploadAvatar">{{ t('common.upload') }}</UButton>
              </div>
            </template>
          </UModal>
          <UButton icon="i-lucide-pencil" @click="openEdit">{{ t('settings.profile.editProfile') }}</UButton>
        </div>
      </div>

      <dl class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div v-for="item in profileItems" :key="item.label" class="flex flex-col gap-1">
          <dt class="text-xs text-muted">{{ item.label }}</dt>
          <dd class="text-sm">{{ item.value || t('settings.profile.notSet') }}</dd>
        </div>
      </dl>
    </UPageCard>

    <UPageCard :title="t('settings.language.title')" :description="t('settings.language.description')" class="mt-4">
      <UFormField :label="t('settings.language.label')">
        <USelect :model-value="locale" :items="languageItems" class="w-48"
          @update:model-value="setLocale($event as AppLocale)" />
      </UFormField>
    </UPageCard>

    <UModal v-model:open="editOpen" :title="t('settings.profile.editModalTitle')">
      <template #body>
        <UForm :schema="schema" :state="editState" class="space-y-4" @submit="onSubmit">
          <UFormField :label="t('settings.profile.email')">
            <UInput :model-value="userStore.user.email" disabled class="w-full" />
          </UFormField>
          <UFormField :label="t('settings.profile.userName')">
            <UInput :model-value="userStore.user.userName" disabled class="w-full" />
          </UFormField>
          <UFormField :label="t('settings.profile.nickName')" name="nickName">
            <UInput v-model="editState.nickName" class="w-full" />
          </UFormField>
          <UFormField :label="t('settings.profile.city')" name="city">
            <UInput v-model="editState.city" class="w-full" />
          </UFormField>
          <UFormField :label="t('settings.profile.phone')" name="phone">
            <UInput v-model="editState.phone" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" @click="editOpen = false">{{ t('common.cancel') }}</UButton>
            <UButton type="submit" :loading="submitting">{{ t('common.save') }}</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </DashboardPanel>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../store';
import { updateUserRequest } from '../api/userApi';
import { locale } from '../utils/useStorage';
import { setLocale, type AppLocale } from '../i18n';
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { User } from '../utils/types';

const { t } = useI18n()

function buildSchema() {
  return z.object({
    nickName: z.string()
      .min(1, t('settings.validation.nickNameRequired'))
      .max(30, t('settings.validation.nickNameMax')),
    city: z.string().max(50, t('settings.validation.cityMax')).optional(),
    phone: z.string().max(11, t('settings.validation.phoneMax')).optional()
  })
}

const schema = computed(buildSchema)

type Schema = z.output<ReturnType<typeof buildSchema>>

const toast = useToast();
const userStore = useUserStore()

const avatar = computed(() => ({
  src: userStore.user.avatar + '?v=' + userStore.avatarVersion,
  icon: 'i-lucide-image'
}))

const profileItems = computed(() => [
  { label: t('settings.profile.email'), value: userStore.user.email },
  { label: t('settings.profile.userName'), value: userStore.user.userName },
  { label: t('settings.profile.nickName'), value: userStore.user.nickName },
  { label: t('settings.profile.city'), value: userStore.user.city },
  { label: t('settings.profile.phone'), value: userStore.user.phone },
  { label: t('settings.profile.createdAt'), value: userStore.user.createdAt },
])

const languageItems = computed(() => [
  { label: t('settings.language.zhCN'), value: 'zh-CN' },
  { label: t('settings.language.enUS'), value: 'en-US' },
])

// 头像上传
const avatarOpen = ref(false);
const avatarFile = ref<null | File>(null);
const avatarUploading = ref(false);

async function uploadAvatar() {
  if (avatarFile.value === null) {
    toast.add({
      title: t('settings.toast.validationError'),
      description: t('settings.toast.selectFileFirst'),
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'warning'
    })
    return;
  }
  avatarUploading.value = true;
  const { err } = await updateUserRequest(userStore.user, avatarFile.value);
  avatarUploading.value = false;
  if (err) {
    toast.add({
      title: t('settings.toast.uploadFailed'),
      description: err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    })
    return;
  }
  toast.add({
    title: t('settings.toast.uploadSuccess'),
    description: t('settings.toast.avatarUpdated'),
    icon: 'i-lucide-check-circle'
  });
  avatarFile.value = null;
  avatarOpen.value = false;
  userStore.incrementAvatarVersion();
}

// 资料编辑
const editOpen = ref(false);
const submitting = ref(false);
const editState = reactive<Partial<Schema>>({
  nickName: undefined,
  city: undefined,
  phone: undefined
})

function openEdit() {
  editState.nickName = userStore.user.nickName;
  editState.city = userStore.user.city;
  editState.phone = userStore.user.phone;
  editOpen.value = true;
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const user: User = {
    ...userStore.user,
    nickName: event.data.nickName,
    city: event.data.city,
    phone: event.data.phone,
  }
  submitting.value = true;
  const { err, data } = await updateUserRequest(user, null);
  submitting.value = false;
  if (err) {
    toast.add({
      title: t('settings.toast.updateFailed'),
      description: err,
      icon: 'i-material-symbols:error-circle-rounded-outline-sharp',
      color: 'error'
    })
    return;
  }
  if (data) {
    userStore.updateUser(data);
    editOpen.value = false;
    toast.add({
      title: t('settings.toast.updateSuccess'),
      description: t('settings.toast.profileSaved'),
      icon: 'i-lucide-check-circle'
    });
  }
}
</script>

<style scoped></style>
