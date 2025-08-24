<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

      <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
              {{ isEdit ? $t('common.updatePost') : $t('common.createPost') }}
            </h3>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700">
                  {{ $t('common.title') }}
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  maxlength="255"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  :placeholder="$t('common.title')"
                />
              </div>

              <div>
                <label for="content" class="block text-sm font-medium text-gray-700">
                  {{ $t('common.content') }}
                </label>
                <textarea
                  id="content"
                  v-model="form.content"
                  rows="10"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  :placeholder="$t('common.content')"
                ></textarea>
              </div>

              <div v-if="error" class="text-red-600 text-sm">
                {{ error }}
              </div>

              <div class="mt-5 sm:mt-4 sm:flex sm:justify-between sm:items-center">
                <!-- 左侧：删除按钮 -->
                <div v-if="isEdit" class="flex justify-start">
                  <button
                    type="button"
                    :disabled="loading"
                    @click="handleDelete"
                    class="inline-flex items-center rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {{ $t('common.delete') }}
                  </button>
                </div>

                <!-- 右侧：保存和取消按钮 -->
                <div class="flex flex-col-reverse sm:flex-row sm:space-x-3">
                  <button
                    type="submit"
                    :disabled="loading"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:mt-0 sm:min-w-[120px] disabled:opacity-50"
                  >
                    <span v-if="loading" class="inline-flex items-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ $t('common.loading') }}
                    </span>
                    <span v-else>
                      {{ isEdit ? $t('common.save') : $t('common.createPost') }}
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0"
                    @click="close"
                  >
                    {{ $t('common.cancel') }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { usePostsStore } from '../stores/posts'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import type { Post } from '../stores/posts'

const { t } = useI18n()
const postsStore = usePostsStore()

const props = defineProps<{
  isOpen: boolean
  post?: Post | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const isEdit = computed(() => !!props.post)
const loading = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  content: ''
})

watch(() => props.post, (newPost) => {
  if (newPost) {
    form.title = newPost.title
    form.content = newPost.content || ''
  } else {
    form.title = ''
    form.content = ''
  }
  error.value = ''
}, { immediate: true })

const close = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  form.title = ''
  form.content = ''
  error.value = ''
}

const handleSubmit = async () => {
  if (!form.title.trim() || !form.content.trim()) {
    error.value = t('posts.titleRequired')
    return
  }

  loading.value = true
  error.value = ''

  try {
    let result
    if (isEdit.value && props.post) {
      result = await postsStore.updatePost(props.post.id, {
        title: form.title.trim(),
        content: form.content.trim()
      })
    } else {
      // 这里需要用户ID，应该在父组件中传入
      const authStore = useAuthStore()
      if (!authStore.user) {
        error.value = '用户未登录'
        return
      }
      result = await postsStore.createPost(
        form.title.trim(),
        form.content.trim(),
        authStore.user.id
      )
    }

    if (result.success) {
      emit('success')
      close()
    } else {
      error.value = result.error
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!props.post) return

  if (!confirm(t('posts.deleteConfirm'))) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await postsStore.deletePost(props.post.id)
    if (result.success) {
      emit('success')
      close()
    } else {
      error.value = result.error
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
