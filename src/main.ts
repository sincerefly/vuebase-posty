import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { i18n } from './locales'
import App from './App.vue'

// 导入Tailwind CSS
import './style.css'

// 等待DOM准备就绪
document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(i18n)

  // 挂载应用
  app.mount('#app')
})
