import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { Tables } from '../types/database.types'

export type Post = Tables<'posts'> & {
  users?: {
    username: string
  }
}

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const userPosts = ref<Post[]>([]) // 新增：用户文章状态
  const loading = ref(false)
  const filter = ref<'all' | 'published' | 'unpublished'>('all')

  // 获取已发布的文章（广场页面）
  const fetchPublishedPosts = async () => {
    console.log('fetchPublishedPosts: 开始获取已发布文章')
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:user_id(username)
        `)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })

      if (error) {
        console.error('fetchPublishedPosts: 数据库查询错误:', error)
        throw error
      }
      
      console.log('fetchPublishedPosts: 获取到文章数量:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('fetchPublishedPosts: 文章列表:', data.map(p => ({ id: p.id, title: p.title, published_at: p.published_at })))
      }
      posts.value = data || []
    } catch (error) {
      console.error('获取已发布文章失败:', error)
      posts.value = []
    } finally {
      loading.value = false
      console.log('fetchPublishedPosts: 完成，当前文章数量:', posts.value.length)
    }
  }

  // 获取用户的所有文章（我的页面）
  const fetchUserPosts = async (userId: string) => {
    console.log('fetchUserPosts: 开始获取用户文章，用户ID:', userId)
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:user_id(username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('fetchUserPosts: 数据库查询错误:', error)
        throw error
      }
      
      console.log('fetchUserPosts: 获取到文章数量:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('fetchUserPosts: 文章列表:', data.map(p => ({ id: p.id, title: p.title })))
      }
      userPosts.value = data || [] // 使用userPosts而不是posts
    } catch (error) {
      console.error('获取用户文章失败:', error)
      userPosts.value = []
    } finally {
      loading.value = false
      console.log('fetchUserPosts: 完成，当前用户文章数量:', userPosts.value.length)
    }
  }

  // 根据筛选条件过滤文章（广场页面）
  const filteredPosts = computed(() => {
    if (filter.value === 'all') return posts.value
    if (filter.value === 'published') {
      return posts.value.filter(post => post.published_at)
    }
    return posts.value.filter(post => !post.published_at)
  })

  // 根据筛选条件过滤用户文章（我的页面）
  const filteredUserPosts = computed(() => {
    console.log('filteredUserPosts: 计算过滤后的用户文章，filter:', filter.value, 'userPosts数量:', userPosts.value.length)
    
    let result
    if (filter.value === 'all') {
      result = userPosts.value
    } else if (filter.value === 'published') {
      result = userPosts.value.filter(post => post.published_at)
    } else {
      result = userPosts.value.filter(post => !post.published_at)
    }
    
    console.log('filteredUserPosts: 过滤结果数量:', result.length)
    return result
  })

  // 创建文章
  const createPost = async (title: string, content: string, userId: string) => {
    try {
      console.log('创建文章，传入用户ID:', userId)
      
      // 获取当前用户会话
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('当前会话:', session?.access_token ? '有token' : '无token')
      console.log('当前用户:', user?.id)
      console.log('传入用户ID:', userId)
      console.log('用户ID是否匹配:', user?.id === userId)
      
      // 先插入文章，不返回数据
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          title,
          content
        })

      if (insertError) {
        console.error('创建文章失败:', insertError)
        console.error('错误详情:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        throw insertError
      }

      console.log('创建文章成功')
      
      // 重新获取用户文章列表来更新UI
      if (user?.id) {
        await fetchUserPosts(user.id)
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('创建文章异常:', error)
      return { success: false, error: error.message }
    }
  }

  // 更新文章
  const updatePost = async (id: number, updates: { title?: string; content?: string }) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新本地状态 - 同时更新posts和userPosts
      const postsIndex = posts.value.findIndex(post => post.id === id)
      if (postsIndex !== -1) {
        posts.value[postsIndex] = data
      }
      
      const userPostsIndex = userPosts.value.findIndex(post => post.id === id)
      if (userPostsIndex !== -1) {
        userPosts.value[userPostsIndex] = data
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 发布文章
  const publishPost = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新本地状态 - 同时更新posts和userPosts
      const postsIndex = posts.value.findIndex(post => post.id === id)
      if (postsIndex !== -1) {
        posts.value[postsIndex] = data
      }
      
      const userPostsIndex = userPosts.value.findIndex(post => post.id === id)
      if (userPostsIndex !== -1) {
        userPosts.value[userPostsIndex] = data
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 删除文章
  const deletePost = async (id: number) => {
    console.log('deletePost: 开始删除文章，ID:', id)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('deletePost: 删除失败:', error)
        throw error
      }

      console.log('deletePost: 删除成功')
      // 更新本地状态 - 同时更新posts和userPosts
      posts.value = posts.value.filter(post => post.id !== id)
      userPosts.value = userPosts.value.filter(post => post.id !== id)

      return { success: true }
    } catch (error: any) {
      console.error('deletePost: 删除异常:', error)
      return { success: false, error: error.message }
    }
  }

  // 设置筛选条件
  const setFilter = (newFilter: 'all' | 'published' | 'unpublished') => {
    filter.value = newFilter
  }

  // 清除所有文章数据
  const clearPosts = () => {
    console.log('clearPosts: 清除所有文章数据')
    posts.value = []
    userPosts.value = []
    filter.value = 'all'
  }

  return {
    posts,
    userPosts, // 新增：返回用户文章状态
    loading,
    filter,
    filteredPosts,
    filteredUserPosts, // 新增：返回过滤后的用户文章
    fetchPublishedPosts,
    fetchUserPosts,
    createPost,
    updatePost,
    publishPost,
    deletePost,
    setFilter,
    clearPosts // 新增：返回清除方法
  }
})
