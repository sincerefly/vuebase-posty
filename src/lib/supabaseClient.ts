import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

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
  }
})