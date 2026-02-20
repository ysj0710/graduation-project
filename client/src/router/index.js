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
import RiskMonitor from '../views/admin/RiskMonitor.vue'
import AddUser from '../views/admin/AddUser.vue'
import BatchOperation from '../views/admin/BatchOperation.vue'
import FinanceStats from '../views/admin/FinanceStats.vue'
import CategoryAnalysis from '../views/admin/CategoryAnalysis.vue'
import TrendReport from '../views/admin/TrendReport.vue'
import ExportCenter from '../views/admin/ExportCenter.vue'
import BasicSettings from '../views/admin/BasicSettings.vue'
import CategoryManage from '../views/admin/CategoryManage.vue'
import MessageTemplate from '../views/admin/MessageTemplate.vue'
import OperationLog from '../views/admin/OperationLog.vue'
import NotificationCenter from '../views/admin/NotificationCenter.vue'

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
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
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
      // 用户管理
      {
        path: 'users',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户列表' }
      },
      {
        path: 'risk',
        name: 'RiskMonitor',
        component: RiskMonitor,
        meta: { title: '风险监控' }
      },
      {
        path: 'users-add',
        name: 'AddUser',
        component: AddUser,
        meta: { title: '新增用户' }
      },
      {
        path: 'users-batch',
        name: 'BatchOperation',
        component: BatchOperation,
        meta: { title: '批量操作' }
      },
      // 财务数据
      {
        path: 'finance-stats',
        name: 'FinanceStats',
        component: FinanceStats,
        meta: { title: '消费统计' }
      },
      {
        path: 'finance-category',
        name: 'CategoryAnalysis',
        component: CategoryAnalysis,
        meta: { title: '分类分析' }
      },
      {
        path: 'finance-trend',
        name: 'TrendReport',
        component: TrendReport,
        meta: { title: '趋势报表' }
      },
      {
        path: 'finance-export',
        name: 'ExportCenter',
        component: ExportCenter,
        meta: { title: '导出中心' }
      },
      // 系统设置
      {
        path: 'settings-basic',
        name: 'BasicSettings',
        component: BasicSettings,
        meta: { title: '基础配置' }
      },
      {
        path: 'settings-category',
        name: 'CategoryManage',
        component: CategoryManage,
        meta: { title: '分类管理' }
      },
      {
        path: 'settings-message',
        name: 'MessageTemplate',
        component: MessageTemplate,
        meta: { title: '消息模板' }
      },
      {
        path: 'settings-log',
        name: 'OperationLog',
        component: OperationLog,
        meta: { title: '操作日志' }
      },
      // 消息中心
      {
        path: 'notifications',
        name: 'NotificationCenter',
        component: NotificationCenter,
        meta: { title: '消息中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
