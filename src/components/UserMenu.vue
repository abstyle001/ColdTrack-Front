<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useColorMode } from '@vueuse/core'
import { getTokenClaimRequest, getUserInfoRequest } from '../api/userApi';
import { loginStatus, token } from '../utils/useStorage';
import router from '../router';
import { useUserStore } from '../store';

defineProps<{
  collapsed?: boolean
}>()

const userStore = useUserStore();

const colorMode = useColorMode();
const appConfig = useAppConfig();

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const user = computed(() => ({
  name: userStore.user.nickName,
  avatar: {
    src: userStore.user.avatar + '?v=' + userStore.avatarVersion,
    alt: userStore.user.nickName
  }
}));

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: '个人信息',
  icon: 'i-lucide-user',
  to: '/me'
}, {
  label: '设置',
  icon: 'i-lucide-settings',
  to: '/settings'
}], [{
  label: '主题',
  icon: 'i-lucide-palette',
  children: [{
    label: '主题色',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: {
      align: 'center',
      collisionPadding: 16
    },
    children: colors.map(color => ({
      label: color,
      chip: color,
      slot: 'chip',
      checked: appConfig.ui.colors.primary === color,
      type: 'checkbox',
      onSelect: (e) => {
        e.preventDefault()

        appConfig.ui.colors.primary = color
      }
    }))
  }, {
    label: 'Neutral',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: {
      align: 'end',
      collisionPadding: 16
    },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: appConfig.ui.colors.neutral === color,
      onSelect: (e) => {
        e.preventDefault()

        appConfig.ui.colors.neutral = color
      }
    }))
  }]
}, {
  label: '外观',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()

      colorMode.value = 'light'
    }
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.value = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}], [{
  label: 'GitHub',
  icon: 'simple-icons:github',
  to: 'https://github.com/nuxt-ui-pro/dashboard-vue',
  target: '_blank'
}], [{
  label: '退出登录',
  icon: 'i-lucide-log-out',
  onSelect: (e) => {
    e.preventDefault();
    token.value = '';
    loginStatus.value = false;
    router.replace('/login');
  }
}]]))

// 获取用户信息
async function getUserInfo(id: string) {
  const data = await getUserInfoRequest(id);
  if (data) {
    // user.value = {
    //   name: data.nickName,
    //   avatar: {
    //     src: data.avatar + '?v=' + userStore.avatarVersion,
    //     alt: data.nickName
    //   }
    // }
    userStore.updateUser(data);
  }
}

onMounted(async () => {
  const data = await getTokenClaimRequest();
  if (data) {
    getUserInfo(data.id);
  }
})
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }">
    <UButton v-bind="{
      ...user,
      label: collapsed ? undefined : user?.name,
      trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
    }" color="neutral" variant="ghost" block :square="collapsed" class="data-[state=open]:bg-elevated" :ui="{
      trailingIcon: 'text-dimmed'
    }" />

    <template #chip-leading="{ item }">
      <span :style="{
        '--chip-light': `var(--color-${(item as any).chip}-500)`,
        '--chip-dark': `var(--color-${(item as any).chip}-400)`
      }" class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)" />
    </template>
  </UDropdownMenu>
</template>