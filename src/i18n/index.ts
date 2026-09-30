import { createI18n } from 'vue-i18n'
import type { WritableComputedRef } from 'vue'
import zhCN, { type MessageSchema } from '../locales/zh-CN'
import enUS from '../locales/en-US'
import { locale } from '../utils/useStorage'

export type AppLocale = 'zh-CN' | 'en-US'

export const i18n = createI18n<[MessageSchema], AppLocale>({
  legacy: false,
  locale: locale.value,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export function setLocale(value: AppLocale) {
  locale.value = value
  ;(i18n.global.locale as unknown as WritableComputedRef<AppLocale>).value = value
}
