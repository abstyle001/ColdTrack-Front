<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { zh_cn, en } from '@nuxt/ui/locale';

const { locale } = useI18n();
const uiLocale = computed(() => (locale.value === 'zh-CN' ? zh_cn : en));
</script>

<template>
  <UApp :locale="uiLocale">
    <router-view></router-view>
  </UApp>
</template>

<style scoped>
</style>
