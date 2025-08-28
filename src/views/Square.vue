<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('common.square') }}</h1>
      <p class="text-gray-600">{{ $t('common.discoverContent') }}</p>
    </div>

    <!-- 调试按钮 -->
    <div v-if="isDev" class="mb-4 p-4 bg-yellow-100 rounded-lg">
      <h3 class="text-sm font-medium text-yellow-800 mb-2">调试工具</h3>
      <div class="space-x-2">
        <button
          @click="refreshAuth"
          class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          刷新认证状态
        </button>
        <button
          @click="refreshPosts"
          class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          刷新文章
        </button>
        <button
          @click="testConnection"
          class="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          测试连接
        </button>
      </div>
      <div class="mt-2 text-xs text-yellow-700">
        <div>认证状态: {{ authStore.isAuthenticated ? '已登录' : '未登录' }}</div>
        <div>用户名: {{ authStore.username }}</div>
        <div>用户ID: {{ authStore.user?.id || '无' }}</div>
        <div>文章数量: {{ postsStore.posts.length }}</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="postsStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- 文章列表 -->
    <div v-else-if="postsStore.posts.length > 0" class="space-y-6">
      <article
        v-for="post in postsStore.posts"
        :key="post.id"
        class="bg-white shadow rounded-lg p-6"
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold text-gray-900">{{ post.title }}</h2>
          <div class="text-sm text-gray-500">
            {{ formatDate(post.published_at || post.created_at) }}
          </div>
        </div>
        <p class="text-gray-600 mb-4">{{ post.content }}</p>
        <div class="text-sm text-gray-500">
          {{ $t('common.author') }}: {{ getAuthorName(post.users?.email || null) }}
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-12">
      <div class="text-gray-500">
        {{ $t('common.noPublishedPosts') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePostsStore } from '../stores/posts'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const postsStore = usePostsStore()
const authStore = useAuthStore()

// 检查是否为开发环境
const isDev = import.meta.env.DEV

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取作者名称（使用邮箱前缀，首字母大写）
const getAuthorName = (email: string | null) => {
  if (!email) return t('common.unknownUser')
  const emailPrefix = email.split('@')[0]
  return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
}

// 调试功能
const refreshAuth = async () => {
  console.log('手动刷新认证状态...')
  await authStore.forceRefreshAuth()
}

const refreshPosts = async () => {
  console.log('手动刷新文章...')
  await postsStore.fetchPublishedPosts()
}

const testConnection = async () => {
  console.log('测试Supabase连接...')
  const result = await postsStore.testSupabaseConnection()
  console.log('连接测试结果:', result)
}

onMounted(() => {
  postsStore.fetchPublishedPosts()
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
