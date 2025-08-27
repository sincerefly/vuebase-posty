import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// 添加调试信息
console.log('Supabase客户端配置:')
console.log('URL:', supabaseUrl ? '已配置' : '未配置')
console.log('Key:', supabaseAnonKey ? '已配置' : '未配置')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 自动刷新token
    autoRefreshToken: true,
    // 持久化认证状态
    persistSession: true,
    // 检测认证状态变化
    detectSessionInUrl: true,
    // 存储类型：localStorage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // 存储键名
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'X-Client-Info': 'vuebase-posty'
    }
  }
})

console.log('Supabase客户端创建完成')

// 添加页面可见性监听器，在页面变为可见时唤醒Supabase客户端
if (typeof window !== 'undefined') {
  let isWakingUp = false
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isWakingUp) {
      console.log('页面变为可见，Supabase客户端已就绪')
      isWakingUp = true
      
      // 简单的延迟重置，避免重复触发
      setTimeout(() => {
        isWakingUp = false
      }, 1000)
    }
  })
}