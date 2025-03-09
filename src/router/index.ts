import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import { supabase } from '../lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/generate/new',
      name: 'thumbnail-generator',
      component: () => import('../views/ThumbnailGenerator.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (to.meta.requiresAuth && !session) {
    next('/')
  } else if (to.path === '/' && session) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router