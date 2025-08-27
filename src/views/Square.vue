<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('common.square') }}</h1>
          <p class="text-gray-600">{{ $t('common.discoverContent') }}</p>
        </div>
        <div class="flex space-x-2">
          <button
            @click="() => { 
              console.log('Square: 刷新按钮被点击'); 
              resetLoadingState(); 
              fetchPublishedPosts(); 
            }"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>

          <!-- 调试按钮，只在开发环境显示 -->
          <template v-if="isDev">
            <button
              @click="checkAndReinitSupabase"
              class="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
            >
              检查状态
            </button>
            <button
              @click="testUserPermissions"
              class="inline-flex items-center px-3 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
            >
              测试权限
            </button>
          </template>

        </div>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col justify-center items-center py-12">
      <div class="flex items-center mb-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">{{ $t('common.loading') }}</span>
      </div>
      <div class="space-x-2">
        <button
          @click="resetLoadingState"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          重置加载状态
        </button>
        <button
          @click="forceResetAll"
          class="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
        >
          完全重置
        </button>
      </div>
    </div>

    <div v-else-if="posts.length === 0" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500">{{ $t('common.noPosts') }}</p>
    </div>

    <div v-else class="space-y-6">
      <article
        v-for="post in posts"
        :key="post.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ post.title }}</h2>
            <p class="text-gray-600 mb-4 line-clamp-3">{{ post.content }}</p>
            
            <div class="flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center space-x-4">
                <span class="flex items-center">
                  <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ post.users?.username || $t('common.anonymousUser') }}
                </span>
                <span class="flex items-center">
                  <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8" />
                  </svg>
                  {{ formatDate(post.published_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { usePostsStore } from '../stores/posts'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabaseClient'

const { t } = useI18n()
const route = useRoute()
const postsStore = usePostsStore()
const authStore = useAuthStore()

// 开发环境标识
const isDev = import.meta.env.DEV

// 使用computed确保响应性
const posts = computed(() => postsStore.posts)
const loading = computed(() => postsStore.loading)
const { fetchPublishedPosts, resetLoadingState, forceResetAll, checkAndReinitSupabase, testUserPermissions } = postsStore

// 防止重复调用的标记
const hasInitialized = ref(false)
const lastFetchTime = ref(0)

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 监听路由变化，每次进入广场页面时刷新数据
watch(() => route.name, (newRouteName, oldRouteName) => {
  console.log('Square: 路由变化:', oldRouteName, '->', newRouteName)
  // 移除自动刷新逻辑，只在用户操作时获取数据
})

// 监听认证状态变化，确保在认证完成后获取数据
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  console.log('Square: 认证状态变化:', isAuthenticated)
  // 移除自动获取数据的逻辑，只在用户操作时获取
})

// 监听用户状态变化（只在用户从无到有时触发）
watch(() => authStore.user, (newUser, oldUser) => {
  console.log('Square: 用户状态变化:', newUser?.email || '无用户', '之前:', oldUser?.email || '无用户')
  // 移除自动获取数据的逻辑，只在用户操作时获取
}, { immediate: true })

// 监听posts变化
watch(posts, (newPosts) => {
  console.log('Square: posts状态变化，文章数量:', newPosts.length)
}, { immediate: true })

onMounted(async () => {
  console.log('Square: 组件挂载')
  
  // 等待认证状态初始化完成
  if (!authStore.user && !authStore.loading) {
    console.log('Square: 等待认证状态初始化...')
    await authStore.initAuth()
  } else if (authStore.loading) {
    console.log('Square: 认证状态正在初始化中，等待完成...')
    // 等待认证完成
    while (authStore.loading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // 标记已初始化
  hasInitialized.value = true
  
  // 如果没有数据，则获取已发布的文章
  if (posts.value.length === 0) {
    console.log('Square: 初始化时没有数据，获取已发布文章')
    fetchPublishedPosts()
  }
  
  console.log('Square: 组件挂载完成')
})

// 当组件被激活时（路由切换回来），不自动刷新数据
onActivated(() => {
  console.log('Square: 组件被激活，但不自动刷新数据')
  // 移除自动刷新逻辑，只在用户操作时刷新
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
