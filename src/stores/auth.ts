import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '../types/database.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Tables<'users'> | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const username = computed(() => profile.value?.username || user.value?.email)

  // 初始化用户状态
  const initAuth = async () => {
    // 防止重复初始化
    if (loading.value) {
      console.log('initAuth: 已在初始化中，跳过重复调用')
      return
    }
    
    loading.value = true
    try {
      console.log('初始化认证状态...')
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
      
      if (currentUser) {
        console.log('发现已登录用户:', currentUser.email)
        try {
          await fetchProfile(currentUser.id)
        } catch (profileError) {
          console.warn('初始化时获取用户资料失败:', profileError)
        }
      } else {
        console.log('未发现已登录用户')
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取用户资料
  const fetchProfile = async (userId: string) => {
    console.log('fetchProfile: 开始获取用户资料，用户ID:', userId)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('fetchProfile: 数据库查询错误:', error)
        throw error
      }
      
      console.log('fetchProfile: 获取到用户资料:', data)
      profile.value = data
    } catch (error) {
      console.error('获取用户资料失败:', error)
      // 如果用户资料不存在，尝试创建
      console.log('尝试创建用户资料...')
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userData.user.id,
              username: userData.user.email?.split('@')[0] || 'user',
              email: userData.user.email
            })
          
          if (insertError) {
            console.error('创建用户资料失败:', insertError)
          } else {
            console.log('用户资料创建成功')
            // 重新获取用户资料
            const { data: newProfile, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single()
            
            if (!fetchError && newProfile) {
              profile.value = newProfile
              console.log('重新获取用户资料成功:', newProfile)
            }
          }
        }
      } catch (createError) {
        console.error('创建用户资料异常:', createError)
      }
    }
  }

  // 注册
  const register = async (email: string, password: string, username: string) => {
    loading.value = true
    try {
      console.log('开始注册...', { email, username })
      
      // 使用正确的 Supabase 注册格式
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (error) {
        console.error('注册错误:', error)
        throw error
      }

      if (data.user) {
        console.log('注册成功，用户数据:', data.user)
        
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            email
          })

        if (profileError) {
          console.error('创建用户资料失败:', profileError)
          // 不抛出错误，因为用户注册已经成功
        }

        user.value = data.user
        await fetchProfile(data.user.id)
        console.log('用户资料创建成功')
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('注册异常:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
      console.log('注册loading状态重置为false')
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      console.log('开始登录...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('登录错误:', error)
        throw error
      }

      console.log('登录成功，用户数据:', data.user)
      console.log('会话数据:', data.session)
      
      user.value = data.user
      if (data.user) {
        try {
          await fetchProfile(data.user.id)
          console.log('用户资料获取成功:', profile.value)
        } catch (profileError) {
          console.warn('获取用户资料失败，但登录成功:', profileError)
        }
      }

      // 注意：不需要手动调用initAuth，因为auth监听器会自动处理状态更新
      console.log('登录流程完成')
      
      return { success: true, data }
    } catch (error: any) {
      console.error('登录异常:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
      console.log('登录loading状态重置为false')
    }
  }

  // 登出
  const logout = async () => {
    console.log('开始登出...')
    loading.value = true
    
    try {
      // 直接清除本地状态，不等待服务器响应
      console.log('清除本地状态...')
      user.value = null
      profile.value = null
      
      // 清除本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      }
      
      // 异步调用Supabase登出，但不等待结果
      console.log('异步调用Supabase登出...')
      supabase.auth.signOut().then(() => {
        console.log('Supabase登出完成')
      }).catch((error) => {
        console.warn('Supabase登出失败，但本地状态已清除:', error)
      })
      
      console.log('本地状态已清除')
      return { success: true }
    } catch (error: any) {
      console.error('登出异常:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
      console.log('登出loading状态重置为false')
    }
  }

  // 强制登出（不依赖Supabase服务器响应）
  const forceLogout = () => {
    console.log('强制登出...')
    
    // 清除本地状态
    user.value = null
    profile.value = null
    
    // 清除本地存储
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
    }
    
    console.log('强制登出完成')
    return { success: true }
  }

  // 监听认证状态变化
  const setupAuthListener = () => {
    console.log('设置认证状态监听器...')
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('认证状态变化事件:', event, '用户ID:', session?.user?.id, '用户邮箱:', session?.user?.email)
      
      // 立即更新用户状态
      user.value = session?.user ?? null
      console.log('用户状态已更新:', user.value ? '已登录' : '未登录')
      
      if (session?.user) {
        console.log('用户已登录:', session.user.email)
        try {
          await fetchProfile(session.user.id)
          console.log('用户资料获取完成')
        } catch (error) {
          console.error('获取用户资料失败:', error)
        }
      } else {
        console.log('用户已登出，清除用户资料')
        profile.value = null
        
        // 清除本地存储（如果还没有被清除）
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        }
      }
      
      // 强制触发响应式更新
      console.log('最终认证状态:', !!user.value)
    })
  }

  // 强制刷新认证状态
  const forceRefreshAuth = async () => {
    console.log('强制刷新认证状态...')
    loading.value = true
    try {
      await initAuth()
      console.log('强制刷新完成，当前认证状态:', !!user.value)
    } catch (error) {
      console.error('强制刷新认证状态失败:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    username,
    initAuth,
    register,
    login,
    logout,
    forceLogout, // 新增：强制登出方法
    setupAuthListener,
    forceRefreshAuth
  }
})
