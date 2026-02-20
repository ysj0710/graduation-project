import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

// 用户端页面 - iPad Pro 风格
import Dashboard from '../views/user/Dashboard.vue'
import Transactions from '../views/user/Transactions.vue'
import Statistics from '../views/user/Statistics.vue'
import Accounts from '../views/user/Accounts.vue'
import Settings from '../views/user/Settings.vue'
import Profile from '../views/user/Profile.vue'

// 管理员端页面
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'
import UserList from '../views/admin/UserList.vue'

// 路由守卫
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  
  if (!token) {
    next('/login')
    return
  }
  
  let userRole = 'user'
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userRole = user.role || 'user'
    } catch (e) {
      console.error('Parse user error:', e)
    }
  }
  
  // 管理员只能访问管理后台
  if (userRole === 'admin') {
    if (to.path.startsWith('/admin')) {
      next()
    } else {
      next('/admin')
    }
    return
  }
  
  // 普通用户不能访问管理后台
  if (to.path.startsWith('/admin')) {
    next('/dashboard')
  } else {
    next()
  }
}

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  // 用户端路由
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    beforeEnter: requireAuth,
    meta: { title: '总览' }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: Transactions,
    beforeEnter: requireAuth,
    meta: { title: '交易记录' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    beforeEnter: requireAuth,
    meta: { title: '统计分析' }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: Accounts,
    beforeEnter: requireAuth,
    meta: { title: '账户管理' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    beforeEnter: requireAuth,
    meta: { title: '设置' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    beforeEnter: requireAuth,
    meta: { title: '个人中心' }
  },
  // 管理员端路由
  {
    path: '/admin',
    component: AdminLayout,
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: '管理总览' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
