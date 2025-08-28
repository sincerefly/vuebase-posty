<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('common.myPosts') }}</h1>
      <p class="text-gray-600">{{ $t('common.managePosts') }}</p>
    </div>

    <!-- 未登录提示 -->
    <div v-if="!isAuthenticated" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p class="text-gray-500 mb-4">{{ $t('common.pleaseLogin') }}</p>
      <div class="space-x-4">
        <button
          @click="showAuthModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {{ $t('common.login') }}
        </button>
      </div>
    </div>

    <!-- 已登录用户界面 -->
    <div v-else>
      <!-- 操作栏 -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <!-- 筛选器 -->
        <div class="flex items-center space-x-4">
          <span class="text-sm font-medium text-gray-700">{{ $t('common.filter') }}:</span>
          <div class="flex space-x-2">
            <button
              v-for="option in filterOptions"
              :key="option.value"
              @click="setFilter(option.value)"
              :class="[
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                filter === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-2">
          <button
            @click="showPostEditor = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('common.createPost') }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col justify-center items-center py-12">
        <div class="flex items-center mb-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">{{ $t('common.loading') }}</span>
        </div>
                  <!-- 调试按钮，只在开发环境显示 -->
          <template v-if="isDev">
            <div class="space-x-2">
              <button
                @click="testSupabaseConnection"
                class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
              >
                测试连接
              </button>
              <button
                @click="testSupabaseBasicConnection"
                class="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded text-green-700 bg-white hover:bg-green-50"
              >
                基本连接测试
              </button>
            </div>
          </template>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredUserPosts.length === 0" class="text-center py-12">
        <!-- 调试信息 -->
        <div v-if="isDev" class="mb-4 p-4 bg-red-100 rounded-lg text-xs">
          <div>调试信息:</div>
          <div>userPosts数量: {{ userPosts.length }}</div>
          <div>filteredUserPosts数量: {{ filteredUserPosts.length }}</div>
          <div>当前filter: {{ filter }}</div>
          <div>loading状态: {{ loading }}</div>
          <div>认证状态: {{ isAuthenticated }}</div>
          <div>用户ID: {{ user?.id || '无' }}</div>
        </div>
        
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-gray-500">{{ $t('common.noPosts') }}</p>
      </div>

      <!-- 文章列表 -->
      <div v-else class="space-y-6">
        <article
          v-for="post in filteredUserPosts"
          :key="post.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <h2 class="text-xl font-semibold text-gray-900">{{ post.title }}</h2>
                <span
                  v-if="post.published_at"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {{ $t('common.published') }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  {{ $t('common.unpublished') }}
                </span>
              </div>
              
              <p class="text-gray-600 mb-4 line-clamp-3">{{ post.content }}</p>
              
              <div class="flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center space-x-4">
                  <span class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8" />
                    </svg>
                    {{ formatDate(post.created_at) }}
                  </span>
                  <span v-if="post.published_at" class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8" />
                    </svg>
                    {{ formatDate(post.published_at) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center space-x-2 ml-4">
              <button
                @click="editPost(post)"
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {{ $t('common.edit') }}
              </button>
              
              <button
                v-if="!post.published_at"
                @click="publishPost(post.id)"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
              >
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ $t('common.publish') }}
              </button>
              
              <button
                v-if="post.published_at"
                @click="unpublishPost(post.id)"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700"
              >
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {{ $t('common.unpublish') }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- 认证模态框 -->
    <AuthModal
      :is-open="showAuthModal"
      mode="login"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <!-- 文章编辑器 -->
    <PostEditor
      :is-open="showPostEditor"
      :post="editingPost"
      @close="closePostEditor"
      @success="handlePostSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePostsStore } from '../stores/posts'
import { useI18n } from 'vue-i18n'
import AuthModal from '../components/AuthModal.vue'
import PostEditor from '../components/PostEditor.vue'
import { supabase } from '../lib/supabaseClient'
import type { Post } from '../stores/posts'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const postsStore = usePostsStore()

// 开发环境标识
const isDev = import.meta.env.DEV

const showAuthModal = ref(false)
const showPostEditor = ref(false)
const editingPost = ref<Post | null>(null)

// 防止重复请求的标记
const hasInitialized = ref(false)
const isFetchingData = ref(false)

// 使用computed来确保响应性
const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)
const userPosts = computed(() => postsStore.userPosts)
const loading = computed(() => postsStore.loading)
const filter = computed(() => postsStore.filter)
const filteredUserPosts = computed(() => postsStore.filteredUserPosts)
const { fetchUserPosts, setFilter, publishPost, unpublishPost, testSupabaseConnection, testSupabaseBasicConnection } = postsStore

const filterOptions: Array<{ value: 'all' | 'published' | 'unpublished'; label: string }> = [
  { value: 'all', label: t('common.all') },
  { value: 'published', label: t('common.published') },
  { value: 'unpublished', label: t('common.unpublished') }
]

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleAuthSuccess = () => {
  console.log('MyPosts: 认证成功，用户ID:', user.value?.id)
  showAuthModal.value = false
  if (user.value) {
    fetchUserPosts(user.value.id)
  }
}

const editPost = (post: Post) => {
  editingPost.value = post
  showPostEditor.value = true
}

const closePostEditor = () => {
  showPostEditor.value = false
  editingPost.value = null
}

const handlePostSuccess = () => {
  if (user.value) {
    fetchUserPosts(user.value.id)
  }
}

const handlePublishPost = async (postId: number) => {
  const result = await publishPost(postId)
  if (result.success) {
    // 可以显示成功提示
  }
}

// 安全的获取用户文章函数，防止重复请求
const safeFetchUserPosts = async (userId: string) => {
  if (isFetchingData.value) {
    console.log('MyPosts: 已在获取数据中，跳过重复请求')
    return
  }
  
  isFetchingData.value = true
  try {
    console.log('MyPosts: 开始获取用户文章，用户ID:', userId)
    await fetchUserPosts(userId)
  } finally {
    isFetchingData.value = false
  }
}

// 监听userPosts变化
watch(userPosts, (newUserPosts) => {
  console.log('MyPosts: userPosts状态变化，文章数量:', newUserPosts.length)
  if (newUserPosts.length > 0) {
    console.log('MyPosts: userPosts文章列表:', newUserPosts.map(p => ({ id: p.id, title: p.title })))
  }
}, { immediate: true })

// 监听filteredUserPosts变化
watch(filteredUserPosts, (newFilteredPosts) => {
  console.log('MyPosts: filteredUserPosts状态变化，文章数量:', newFilteredPosts.length)
}, { immediate: true })

// 监听认证状态变化，确保登录后获取数据
watch(isAuthenticated, (newValue, oldValue) => {
  console.log('MyPosts: 认证状态变化:', oldValue, '->', newValue, '用户:', user.value?.email)
  if (newValue && user.value && hasInitialized.value) {
    // 认证状态变化时，总是获取用户文章（因为auth.ts不再自动获取）
    console.log('MyPosts: 认证状态变化，准备获取用户文章')
    safeFetchUserPosts(user.value.id)
  } else {
    console.log('MyPosts: 认证状态变化，但跳过获取文章:', {
      hasInitialized: hasInitialized.value,
      hasUser: !!user.value
    })
  }
})

onMounted(async () => {
  console.log('🚀 MyPosts: 组件挂载开始')
  console.log('🚀 初始认证状态:', isAuthenticated.value, '用户:', user.value?.email)
  
  // 等待认证状态初始化完成
  if (!authStore.user && !authStore.loading) {
    console.log('🚀 等待认证状态初始化...')
    await authStore.initAuth()
  } else if (authStore.loading) {
    console.log('🚀 认证状态正在初始化中，等待完成...')
    // 等待认证完成
    while (authStore.loading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // 标记已初始化
  hasInitialized.value = true
  console.log('🚀 hasInitialized 设置为 true')
  
  // 如果已经认证且有用户，则获取文章
  if (isAuthenticated.value && user.value) {
    console.log('🚀 初始化时准备获取用户文章，用户ID:', user.value.id)
    await safeFetchUserPosts(user.value.id)
  } else {
    console.log('🚀 初始化时跳过获取文章:', {
      isAuthenticated: isAuthenticated.value,
      hasUser: !!user.value
    })
  }
  
  console.log('🚀 MyPosts: 组件挂载完成')
})

// 当组件被激活时（路由切换回来），重新获取数据
onActivated(() => {
  console.log('🔄 MyPosts: 组件被激活')
  console.log('🔄 当前认证状态:', isAuthenticated.value, '用户:', user.value?.email)
  if (isAuthenticated.value && user.value) {
    console.log('🔄 激活时准备获取用户文章')
    safeFetchUserPosts(user.value.id)
  } else {
    console.log('🔄 激活时跳过获取文章:', {
      isAuthenticated: isAuthenticated.value,
      hasUser: !!user.value
    })
  }
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
