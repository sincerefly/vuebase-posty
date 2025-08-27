<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('common.square') }}</h1>
      <p class="text-gray-600">发现精彩的文章内容</p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">{{ $t('common.loading') }}</span>
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
                  {{ post.users?.username || '匿名用户' }}
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
import { onMounted, watch, computed } from 'vue'
import { usePostsStore } from '../stores/posts'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const postsStore = usePostsStore()
const authStore = useAuthStore()

// 使用computed确保响应性
const posts = computed(() => postsStore.posts)
const loading = computed(() => postsStore.loading)
const { fetchPublishedPosts } = postsStore

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 监听认证状态变化，确保在认证完成后获取数据
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  console.log('Square: 认证状态变化:', isAuthenticated)
  if (isAuthenticated) {
    console.log('Square: 认证完成，获取已发布文章')
    fetchPublishedPosts()
  }
})

// 监听用户状态变化
watch(() => authStore.user, (newUser) => {
  console.log('Square: 用户状态变化:', newUser?.email || '无用户')
  // 当用户状态确定后，获取文章
  if (newUser !== undefined) {
    console.log('Square: 用户状态确定，获取已发布文章')
    fetchPublishedPosts()
  }
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
  
  // 无论是否认证，广场页面都应该显示已发布的文章
  console.log('Square: 获取已发布文章')
  fetchPublishedPosts()
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
