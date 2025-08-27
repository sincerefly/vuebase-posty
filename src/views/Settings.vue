<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('common.settings') }}</h1>
      <p class="text-gray-600">{{ $t('common.personalizeExperience') }}</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <!-- 语言设置 -->
      <div class="mb-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4">{{ $t('common.language') }}</h2>
        <div class="space-y-3">
          <label
            v-for="lang in languageOptions"
            :key="lang.value"
            class="flex items-center cursor-pointer"
          >
            <input
              type="radio"
              :value="lang.value"
              v-model="selectedLanguage"
              @change="changeLanguage(lang.value)"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-3 text-sm font-medium text-gray-700">{{ lang.label }}</span>
          </label>
        </div>
      </div>

      <!-- 其他设置可以在这里添加 -->
      <div class="border-t border-gray-200 pt-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">{{ $t('common.otherSettings') }}</h2>
        <p class="text-gray-500 text-sm">{{ $t('common.moreSettingsComing') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '../locales'

const { locale } = useI18n()

const selectedLanguage = ref(locale.value)

const languageOptions = [
  { value: 'zh' as const, label: '中文' },
  { value: 'en' as const, label: 'English' }
]

const changeLanguage = (lang: 'zh' | 'en') => {
  setLanguage(lang)
}

onMounted(() => {
  selectedLanguage.value = locale.value
})
</script>
