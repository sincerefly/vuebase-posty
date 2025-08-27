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
  
  // 防止重复请求的标记
  const isFetchingPublished = ref(false)
  const isFetchingUserPosts = ref(false)

  // 获取已发布的文章（广场页面）
  const fetchPublishedPosts = async () => {
    console.log('fetchPublishedPosts: 开始获取已发布文章')
    console.log('fetchPublishedPosts: isFetchingPublished =', isFetchingPublished.value)
    console.log('fetchPublishedPosts: loading =', loading.value)

    // 防止重复请求
    if (isFetchingPublished.value) {
      console.log('fetchPublishedPosts: 已在请求中，跳过重复调用')
      return
    }

    isFetchingPublished.value = true
    loading.value = true

    try {
      console.log('fetchPublishedPosts: 开始数据库查询...')
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
      posts.value = data || []
    } catch (error) {
      console.error('获取已发布文章失败:', error)
      posts.value = []
    } finally {
      console.log('fetchPublishedPosts: 重置状态...')
      loading.value = false
      isFetchingPublished.value = false
      console.log('fetchPublishedPosts: 状态重置完成，isFetchingPublished =', isFetchingPublished.value)
    }
  }

  // 检查Bearer token的来源
  const checkBearerTokenSource = async () => {
    console.log('checkBearerTokenSource: 检查Bearer token来源...')
    
    try {
      // 检查localStorage中的session
      const storageKey = 'supabase.auth.token'
      const storedSession = localStorage.getItem(storageKey)
      console.log('checkBearerTokenSource: localStorage中的session:', storedSession ? '存在' : '不存在')
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        console.log('checkBearerTokenSource: session数据:', {
          access_token: sessionData.access_token ? '存在' : '不存在',
          refresh_token: sessionData.refresh_token ? '存在' : '不存在',
          expires_at: sessionData.expires_at
        })
      }
      
      // 检查Supabase客户端的session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('checkBearerTokenSource: Supabase客户端session:', session ? '存在' : '不存在')
      
      if (session) {
        console.log('checkBearerTokenSource: 客户端session详情:', {
          access_token: session.access_token ? '存在' : '不存在',
          refresh_token: session.refresh_token ? '存在' : '不存在',
          expires_at: session.expires_at,
          user_id: session.user?.id
        })
      }
      
      // 检查当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('checkBearerTokenSource: 当前用户:', user ? '已认证' : '未认证')
      
      // 模拟一个请求，看看实际的Authorization header
      console.log('checkBearerTokenSource: 模拟请求...')
      const { data, error } = await supabase
        .from('posts')
        .select('count')
        .limit(1)
      
      console.log('checkBearerTokenSource: 请求结果:', error ? '失败' : '成功')
      
      return {
        hasStoredSession: !!storedSession,
        hasClientSession: !!session,
        hasUser: !!user,
        requestSuccess: !error
      }
    } catch (error) {
      console.error('checkBearerTokenSource: 检查失败:', error)
      return null
    }
  }

  // 测试当前用户的权限和认证状态
  const testUserPermissions = async () => {
    console.log('testUserPermissions: 开始测试用户权限...')
    
    try {
      // 检查当前session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('testUserPermissions: 当前session:', session ? '有session' : '无session')
      if (session) {
        console.log('testUserPermissions: 用户ID:', session.user.id)
        console.log('testUserPermissions: 用户邮箱:', session.user.email)
      }
      
      // 尝试获取用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('testUserPermissions: 当前用户:', user ? '已认证' : '未认证')
      
      // 尝试一个需要认证的查询（比如获取用户自己的文章）
      let postsError = null
      if (session) {
        const { data: userPosts, error: userPostsError } = await supabase
          .from('posts')
          .select('id, title')
          .eq('user_id', session.user.id)
          .limit(1)
        
        postsError = userPostsError
        console.log('testUserPermissions: 用户文章查询:', postsError ? '失败' : '成功', '数量:', userPosts?.length || 0)
      }
      
      // 尝试匿名查询（已发布的文章）
      const { data: publicPosts, error: publicError } = await supabase
        .from('posts')
        .select('id, title')
        .not('published_at', 'is', null)
        .limit(1)
      
      console.log('testUserPermissions: 公开文章查询:', publicError ? '失败' : '成功', '数量:', publicPosts?.length || 0)
      
      return {
        hasSession: !!session,
        hasUser: !!user,
        canAccessUserPosts: !session || !postsError,
        canAccessPublicPosts: !publicError
      }
    } catch (error) {
      console.error('testUserPermissions: 测试失败:', error)
      return null
    }
  }

  // 检查并重新初始化Supabase客户端状态
  const checkAndReinitSupabase = async () => {
    console.log('checkAndReinitSupabase: 检查Supabase客户端状态...')
    try {
      // 检查认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('checkAndReinitSupabase: 会话状态:', session ? '有会话' : '无会话')
      
      if (sessionError) {
        console.error('checkAndReinitSupabase: 获取会话失败:', sessionError)
        return false
      }
      
      if (!session) {
        console.log('checkAndReinitSupabase: 无有效会话，需要重新认证')
        return false
      }
      
      // 检查会话是否过期
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('checkAndReinitSupabase: 会话已过期，需要刷新')
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('checkAndReinitSupabase: 刷新会话失败:', refreshError)
            return false
          }
          console.log('checkAndReinitSupabase: 会话刷新成功')
        } catch (refreshError) {
          console.error('checkAndReinitSupabase: 刷新会话异常:', refreshError)
          return false
        }
      }
      
      console.log('checkAndReinitSupabase: Supabase客户端状态正常')
      return true
    } catch (error) {
      console.error('checkAndReinitSupabase: 检查状态异常:', error)
      return false
    }
  }

  // 测试Supabase客户端连接（不依赖特定表）
  const testSupabaseBasicConnection = async () => {
    console.log('testSupabaseBasicConnection: 开始测试基本连接...')
    try {
      // 尝试获取当前用户信息
      console.log('testSupabaseBasicConnection: 获取用户信息...')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('testSupabaseBasicConnection: 获取用户信息失败:', error)
        return false
      }
      
      console.log('testSupabaseBasicConnection: 获取用户信息成功:', user?.email)
      return true
    } catch (error) {
      console.error('testSupabaseBasicConnection: 基本连接测试异常:', error)
      return false
    }
  }

  // 测试Supabase客户端连接
  const testSupabaseConnection = async () => {
    console.log('testSupabaseConnection: 开始测试Supabase连接...')
    try {
      // 尝试一个简单的查询
      const { data, error } = await supabase
        .from('posts')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('testSupabaseConnection: 连接测试失败:', error)
        return false
      }
      
      console.log('testSupabaseConnection: 连接测试成功')
      return true
    } catch (error) {
      console.error('testSupabaseConnection: 连接测试异常:', error)
      return false
    }
  }

  // 获取用户的所有文章（我的页面）
  const fetchUserPosts = async (userId: string) => {
    console.log('fetchUserPosts: 开始获取用户文章，用户ID:', userId)

    // 防止重复请求
    if (isFetchingUserPosts.value) {
      console.log('fetchUserPosts: 已在请求中，跳过重复调用')
      return
    }

    isFetchingUserPosts.value = true
    loading.value = true

    try {
      console.log('fetchUserPosts: 开始数据库查询...')
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
        // 如果是认证错误（4xx），记录详细信息
        if (error.code && error.code.startsWith('4')) {
          console.error('fetchUserPosts: 认证错误，可能需要重新登录')
        }
        throw error
      }

      console.log('fetchUserPosts: 获取到文章数量:', data?.length || 0)
      userPosts.value = data || []
    } catch (error) {
      console.error('获取用户文章失败:', error)
      userPosts.value = []
    } finally {
      loading.value = false
      isFetchingUserPosts.value = false
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

  // 撤回文章
  const unpublishPost = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          published_at: null,
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

  // 重置加载状态（用于错误恢复）
  const resetLoadingState = () => {
    console.log('resetLoadingState: 重置加载状态')
    loading.value = false
    isFetchingPublished.value = false
    isFetchingUserPosts.value = false
  }

  // 完全重置所有状态（用于严重错误恢复）
  const forceResetAll = () => {
    console.log('forceResetAll: 完全重置所有状态')
    posts.value = []
    userPosts.value = []
    filter.value = 'all'
    loading.value = false
    isFetchingPublished.value = false
    isFetchingUserPosts.value = false
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
    unpublishPost,
    deletePost,
    setFilter,
    clearPosts, // 新增：返回清除方法
    resetLoadingState, // 新增：返回重置加载状态方法
    forceResetAll, // 新增：返回完全重置方法
    testSupabaseConnection, // 新增：返回测试连接方法
    testSupabaseBasicConnection, // 新增：返回基本连接测试方法
    checkAndReinitSupabase, // 新增：返回检查并重新初始化Supabase状态方法
    testUserPermissions, // 新增：返回测试用户权限方法
    checkBearerTokenSource // 新增：返回检查Bearer token来源方法
  }
})
