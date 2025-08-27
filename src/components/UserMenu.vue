<template>
  <div class="relative" ref="menuRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
        <span class="text-white font-medium text-sm">
          {{ username?.charAt(0).toUpperCase() }}
        </span>
      </div>
      <span>{{ username }}</span>
      <ChevronDownIcon class="h-4 w-4" />
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
    >
      <div class="py-1">
        <router-link
          to="/settings"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          @click="isOpen = false"
        >
          {{ $t('common.settings') }}
        </router-link>
        <button
          @click="handleLogout"
          :disabled="logoutLoading"
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="logoutLoading" class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登出中...
          </span>
          <span v-else>
            {{ $t('common.logout') }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { usePostsStore } from '../stores/posts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const postsStore = usePostsStore()

const isOpen = ref(false)
const logoutLoading = ref(false)
const menuRef = ref<HTMLElement>()

const username = computed(() => authStore.username)

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

// 组件挂载时添加全局点击事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除全局点击事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = async () => {
  console.log('UserMenu: 开始登出处理')
  logoutLoading.value = true
  
  try {
    const result = await authStore.logout()
    
    if (result.success) {
      console.log('UserMenu: 登出成功')
      
      // 清除posts store的数据
      postsStore.clearPosts()
      
      // 关闭菜单
      isOpen.value = false
      
      // 可选：重定向到广场页面
      // router.push('/square')
    } else {
      console.error('UserMenu: 登出失败:', result.error)
      alert('登出失败: ' + result.error)
    }
  } catch (error: any) {
    console.error('UserMenu: 登出异常:', error)
    alert('登出时发生错误: ' + error.message)
  } finally {
    logoutLoading.value = false
  }
}
</script>
