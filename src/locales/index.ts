import { createI18n } from 'vue-i18n'

const messages = {
  zh: {
    common: {
      square: '广场',
      myPosts: '我的文章',
      login: '登录',
      register: '注册',
      logout: '登出',
      settings: '设置',
      edit: '编辑',
      publish: '发布',
      unpublish: '撤回',
      refresh: '刷新',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      all: '全部',
      published: '已发布',
      unpublished: '未发布',
      filter: '筛选',
      language: '语言',
      chinese: '中文',
      english: 'English',
      pleaseLogin: '请先登录',
      username: '用户名',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      title: '标题',
      content: '内容',
      createPost: '创建文章',
      updatePost: '更新文章',
      noPosts: '暂无文章',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      discoverContent: '发现精彩内容',
      managePosts: '管理您的文章',
      otherSettings: '其他设置',
      moreSettingsComing: '更多设置选项将在后续版本中添加',
      personalizeExperience: '个性化您的体验',
      forceRefreshAuth: '强制刷新认证状态',
      anonymousUser: '匿名用户',
      noPublishedPosts: '暂无已发布文章',
      author: '作者',
      unknownUser: '未知用户'
    },
    auth: {
      loginTitle: '登录',
      registerTitle: '注册',
      loginSuccess: '登录成功',
      registerSuccess: '注册成功',
      logoutSuccess: '登出成功',
      loginFailed: '登录失败',
      registerFailed: '注册失败',
      passwordMismatch: '密码不匹配',
      invalidEmail: '邮箱格式不正确',
      usernameTooShort: '用户名至少3个字符'
    },
    posts: {
      createSuccess: '文章创建成功',
      updateSuccess: '文章更新成功',
      publishSuccess: '文章发布成功',
      unpublishSuccess: '文章撤回成功',
      deleteSuccess: '文章删除成功',
      createFailed: '文章创建失败',
      updateFailed: '文章更新失败',
      publishFailed: '文章发布失败',
      deleteFailed: '文章删除失败',
      titleRequired: '标题不能为空',
      contentRequired: '内容不能为空',
      deleteConfirm: '确定要删除这篇文章吗？此操作不可撤销。'
    }
  },
  en: {
    common: {
      square: 'Square',
      myPosts: 'My Posts',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      settings: 'Settings',
      edit: 'Edit',
      publish: 'Publish',
      unpublish: 'Unpublish',
      refresh: 'Refresh',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      all: 'All',
      published: 'Published',
      unpublished: 'Unpublished',
      filter: 'Filter',
      language: 'Language',
      chinese: '中文',
      english: 'English',
      pleaseLogin: 'Please login first',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      title: 'Title',
      content: 'Content',
      createPost: 'Create Post',
      updatePost: 'Update Post',
      noPosts: 'No posts yet',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      discoverContent: 'Discover amazing content',
      managePosts: 'Manage your posts',
      otherSettings: 'Other Settings',
      moreSettingsComing: 'More settings options will be added in future versions',
      personalizeExperience: 'Personalize your experience',
      forceRefreshAuth: 'Force Refresh Auth Status',
      anonymousUser: 'Anonymous User',
      noPublishedPosts: 'No published posts yet',
      author: 'Author',
      unknownUser: 'Unknown User'
    },
    auth: {
      loginTitle: 'Login',
      registerTitle: 'Register',
      loginSuccess: 'Login successful',
      registerSuccess: 'Register successful',
      logoutSuccess: 'Logout successful',
      loginFailed: 'Login failed',
      registerFailed: 'Register failed',
      passwordMismatch: 'Passwords do not match',
      invalidEmail: 'Invalid email format',
      usernameTooShort: 'Username must be at least 3 characters'
    },
    posts: {
      createSuccess: 'Post created successfully',
      updateSuccess: 'Post updated successfully',
      publishSuccess: 'Post published successfully',
      unpublishSuccess: 'Post unpublished successfully',
      deleteSuccess: 'Post deleted successfully',
      createFailed: 'Failed to create post',
      updateFailed: 'Failed to update post',
      publishFailed: 'Failed to publish post',
      deleteFailed: 'Failed to delete post',
      titleRequired: 'Title is required',
      contentRequired: 'Content is required',
      deleteConfirm: 'Are you sure you want to delete this post? This action cannot be undone.'
    }
  }
}

// 从本地存储获取语言设置
const getStoredLanguage = (): string => {
  return localStorage.getItem('language') || 'zh'
}

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLanguage(),
  fallbackLocale: 'zh',
  messages
})

// 设置语言并保存到本地存储
export const setLanguage = (locale: 'zh' | 'en') => {
  i18n.global.locale.value = locale
  localStorage.setItem('language', locale)
}
