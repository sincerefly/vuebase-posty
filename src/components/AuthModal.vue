<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

      <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
        <div class="absolute right-0 top-0 pr-4 pt-4">
          <button
            type="button"
            class="rounded-md bg-white text-gray-400 hover:text-gray-500"
            @click="close"
          >
            <span class="sr-only">关闭</span>
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <div class="sm:flex sm:items-start">
          <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
              {{ isLogin ? $t('auth.loginTitle') : $t('auth.registerTitle') }}
            </h3>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div v-if="!isLogin">
                <label for="username" class="block text-sm font-medium text-gray-700">
                  {{ $t('common.username') }}
                </label>
                <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  required
                  minlength="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  :placeholder="$t('common.username')"
                />
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  {{ $t('common.email') }}
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  :placeholder="$t('common.email')"
                />
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">
                  {{ $t('common.password') }}
                </label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  minlength="6"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  :placeholder="$t('common.password')"
                />
              </div>

              <div v-if="!isLogin">
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                  {{ $t('common.confirmPassword') }}
                </label>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  minlength="6"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  :placeholder="$t('common.confirmPassword')"
                />
              </div>

              <div v-if="error" class="text-red-600 text-sm">
                {{ error }}
              </div>

              <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  :disabled="localLoading"
                  class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  <span v-if="localLoading" class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ $t('common.loading') }}
                  </span>
                  <span v-else>
                    {{ isLogin ? $t('common.login') : $t('common.register') }}
                  </span>
                </button>
                <button
                  type="button"
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  @click="close"
                >
                  {{ $t('common.cancel') }}
                </button>
              </div>
            </form>

            <div class="mt-4 text-center">
              <button
                type="button"
                class="text-sm text-blue-600 hover:text-blue-500"
                @click="toggleMode"
              >
                {{ isLogin ? $t('common.register') : $t('common.login') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()

const props = defineProps<{
  isOpen: boolean
  mode: 'login' | 'register'
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const isLogin = ref(props.mode === 'login')
const error = ref('')
const localLoading = ref(false) // 使用本地loading状态

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 监听认证状态变化，自动关闭模态框
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated && props.isOpen) {
    console.log('AuthModal: 检测到认证成功，自动关闭模态框')
    localLoading.value = false
    emit('success')
    emit('close')
  }
})

watch(() => props.mode, (newMode) => {
  isLogin.value = newMode === 'login'
  error.value = ''
})

const close = () => {
  console.log('AuthModal: 关闭模态框')
  emit('close')
  resetForm()
}

const resetForm = () => {
  console.log('AuthModal: 重置表单')
  form.username = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  error.value = ''
  // 注意：不在这里重置localLoading，因为可能在登录成功时已经被重置
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const validateForm = () => {
  if (!isLogin.value) {
    if (form.username.length < 3) {
      error.value = t('auth.usernameTooShort')
      return false
    }
    if (form.password !== form.confirmPassword) {
      error.value = t('auth.passwordMismatch')
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  error.value = ''
  localLoading.value = true // 设置本地loading状态

  try {
    let result
    if (isLogin.value) {
      result = await authStore.login(form.email, form.password)
    } else {
      result = await authStore.register(form.email, form.password, form.username)
    }

    if (result.success) {
      console.log('AuthModal: 认证成功，准备关闭模态框')
      // 先重置loading状态，再触发成功事件
      localLoading.value = false
      emit('success')
      close()
    } else {
      error.value = result.error
      localLoading.value = false
    }
  } catch (err: any) {
    console.error('AuthModal: 认证异常:', err)
    error.value = err.message
    localLoading.value = false
  }
}
</script>
