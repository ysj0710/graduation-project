import { createRouter, createWebHistory } from 'vue-router'

// 首页直接加载（用户首次进入必看）
import Dashboard from '../views/user/Dashboard.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'

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

  if (userRole === 'admin') {
    if (to.path.startsWith('/admin')) {
      next()
    } else {
      next('/admin')
    }
    return
  }

  if (to.path.startsWith('/admin')) {
    next('/dashboard')
  } else {
    next()
  }
}

// 带预取的懒加载：加载完当前页后，空闲时预取其他页面
const lazyLoad = (importFn) => () => importFn()

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  },
  // 用户端
  {
    path: '/',
    component: () => import('../views/user/UserLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard, // 首页预加载
        meta: { title: '总览' }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: lazyLoad(() => import('../views/user/Transactions.vue')),
        meta: { title: '交易记录' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: lazyLoad(() => import('../views/user/Statistics.vue')),
        meta: { title: '统计分析' }
      },
      {
        path: 'consumption',
        name: 'ConsumptionAnalysis',
        component: lazyLoad(() => import('../views/user/ConsumptionAnalysis.vue')),
        meta: { title: '消费分析' }
      },
      {
        path: 'personal',
        name: 'Personal',
        component: lazyLoad(() => import('../views/user/Personal.vue')),
        meta: { title: '个性设置' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: lazyLoad(() => import('../views/user/Profile.vue')),
        meta: { title: '个人中心' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: lazyLoad(() => import('../views/user/Notifications.vue')),
        meta: { title: '消息中心' }
      }
    ]
  },
  // 管理员端
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { title: '管理总览' } },
      { path: 'users', name: 'UserList', component: lazyLoad(() => import('../views/admin/UserList.vue')), meta: { title: '用户列表' } },
      { path: 'risk', name: 'RiskMonitor', component: lazyLoad(() => import('../views/admin/RiskMonitor.vue')), meta: { title: '风险监控' } },
      { path: 'users-add', name: 'AddUser', component: lazyLoad(() => import('../views/admin/AddUser.vue')), meta: { title: '新增用户' } },
      { path: 'users-batch', name: 'BatchOperation', component: lazyLoad(() => import('../views/admin/BatchOperation.vue')), meta: { title: '批量操作' } },
      { path: 'finance-stats', name: 'FinanceStats', component: lazyLoad(() => import('../views/admin/FinanceStats.vue')), meta: { title: '消费统计' } },
      { path: 'finance-category', name: 'CategoryAnalysis', component: lazyLoad(() => import('../views/admin/CategoryAnalysis.vue')), meta: { title: '分类分析' } },
      { path: 'finance-trend', name: 'TrendReport', component: lazyLoad(() => import('../views/admin/TrendReport.vue')), meta: { title: '趋势报表' } },
      { path: 'finance-export', name: 'ExportCenter', component: lazyLoad(() => import('../views/admin/ExportCenter.vue')), meta: { title: '导出中心' } },
      { path: 'settings-basic', name: 'BasicSettings', component: lazyLoad(() => import('../views/admin/BasicSettings.vue')), meta: { title: '基础配置' } },
      { path: 'settings-category', name: 'CategoryManage', component: lazyLoad(() => import('../views/admin/CategoryManage.vue')), meta: { title: '分类管理' } },
      { path: 'settings-message', name: 'MessageTemplate', component: lazyLoad(() => import('../views/admin/MessageTemplate.vue')), meta: { title: '消息模板' } },
      { path: 'settings-log', name: 'OperationLog', component: lazyLoad(() => import('../views/admin/OperationLog.vue')), meta: { title: '操作日志' } },
      { path: 'notifications', name: 'NotificationCenter', component: lazyLoad(() => import('../views/admin/NotificationCenter.vue')), meta: { title: '消息中心' } },
      { path: 'send-notification', name: 'SendNotification', component: lazyLoad(() => import('../views/admin/SendNotification.vue')), meta: { title: '发送通知' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由预取：首页加载后，空闲时预加载其他页面
let prefetched = false
router.afterEach((to) => {
  if (prefetched) return
  prefetched = true

  // 延迟预取，不阻塞首页渲染
  setTimeout(() => {
    const userPages = import.meta.glob('../views/user/*.vue')
    const adminPages = import.meta.glob('../views/admin/*.vue')
    // 预取所有非当前页面的组件
    Object.entries({ ...userPages, ...adminPages }).forEach(([path, load]) => {
      // 只预取懒加载的模块
      if (typeof load === 'function') {
        load().catch(() => {}) // 静默失败
      }
    })
  }, 2000)
})

export default router
