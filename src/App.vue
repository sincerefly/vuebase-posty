<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useI18n } from 'vue-i18n'
import AuthModal from './components/AuthModal.vue'
import UserMenu from './components/UserMenu.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const showAuthModal = ref(false)
const authMode = ref<'login' | 'register'>('login')

// 检查是否为开发环境
const isDev = import.meta.env.DEV

// 监听认证状态变化
watch(() => authStore.isAuthenticated, (newValue) => {
  console.log('认证状态变化:', newValue)
  console.log('当前用户:', authStore.user)
  console.log('用户资料:', authStore.profile)
})

const handleAuthSuccess = () => {
  console.log('App: 认证成功回调，关闭模态框')
  showAuthModal.value = false
  // 确保模态框完全关闭
  setTimeout(() => {
    if (showAuthModal.value) {
      console.log('App: 强制关闭模态框')
      showAuthModal.value = false
    }
  }, 100)
}

onMounted(() => {
  console.log('App组件挂载，初始化认证状态...')
  // 初始化认证状态
  authStore.initAuth()
  authStore.setupAuthListener()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- 调试信息 -->
    <div v-if="isDev" class="bg-yellow-100 p-2 text-xs">
      <div>认证状态: {{ authStore.isAuthenticated }}</div>
      <div>用户: {{ authStore.user?.email || '无' }}</div>
      <div>用户ID: {{ authStore.user?.id || '无' }}</div>
    </div>

    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Posty</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/square"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  $route.name === 'square'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                {{ $t('common.square') }}
              </router-link>
              <router-link
                to="/my-posts"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  $route.name === 'myPosts'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                {{ $t('common.myPosts') }}
              </router-link>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <!-- 未登录状态 -->
            <div v-if="!authStore.isAuthenticated" class="flex items-center space-x-2">
              <button
                @click="showAuthModal = true; authMode = 'login'"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                {{ $t('common.login') }}
              </button>
              <button
                @click="showAuthModal = true; authMode = 'register'"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {{ $t('common.register') }}
              </button>
            </div>

            <!-- 已登录状态 -->
            <UserMenu v-else />
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main>
      <router-view />
    </main>

    <!-- 认证模态框 -->
    <AuthModal
      :is-open="showAuthModal"
      :mode="authMode"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
    
    <!-- 调试信息 -->
    <div v-if="isDev" class="fixed bottom-4 right-4 bg-red-100 p-2 text-xs rounded">
      <div>模态框状态: {{ showAuthModal ? '打开' : '关闭' }}</div>
      <div>认证状态: {{ authStore.isAuthenticated ? '已登录' : '未登录' }}</div>
    </div>
  </div>
</template>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>