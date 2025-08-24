import { createRouter, createWebHistory } from 'vue-router'
import Square from '../views/Square.vue'
import MyPosts from '../views/MyPosts.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/square'
    },
    {
      path: '/square',
      name: 'square',
      component: Square
    },
    {
      path: '/my-posts',
      name: 'myPosts',
      component: MyPosts
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    }
  ]
})

export default router
