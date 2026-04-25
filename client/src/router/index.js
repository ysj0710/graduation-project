import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

// 用户端布局
import UserLayout from '../views/user/UserLayout.vue'
import Dashboard from '../views/user/Dashboard.vue'
import Transactions from '../views/user/Transactions.vue'
import Statistics from '../views/user/Statistics.vue'
import ConsumptionAnalysis from '../views/user/ConsumptionAnalysis.vue'
import Personal from '../views/user/Personal.vue'
import Profile from '../views/user/Profile.vue'
import Notifications from '../views/user/Notifications.vue'

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
  // 用户端 - 统一布局
  {
    path: '/',
    component: UserLayout,
    beforeEnter: requireAuth,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '总览' }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: Transactions,
        meta: { title: '交易记录' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: Statistics,
        meta: { title: '统计分析' }
      },
      {
        path: 'consumption',
        name: 'ConsumptionAnalysis',
        component: ConsumptionAnalysis,
        meta: { title: '消费分析' }
      },
      {
        path: 'personal',
        name: 'Personal',
        component: Personal,
        meta: { title: '个性设置' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '个人中心' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: Notifications,
        meta: { title: '消息中心' }
      }
    ]
  },
  // 管理员端路由
  {
    path: '/admin',
    component: AdminLayout,
    beforeEnter: requireAuth,
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { title: '管理总览' } },
      { path: 'users', name: 'UserList', component: UserList, meta: { title: '用户列表' } },
      { path: 'risk', name: 'RiskMonitor', component: RiskMonitor, meta: { title: '风险监控' } },
      { path: 'users-add', name: 'AddUser', component: AddUser, meta: { title: '新增用户' } },
      { path: 'users-batch', name: 'BatchOperation', component: BatchOperation, meta: { title: '批量操作' } },
      { path: 'finance-stats', name: 'FinanceStats', component: FinanceStats, meta: { title: '消费统计' } },
      { path: 'finance-category', name: 'CategoryAnalysis', component: CategoryAnalysis, meta: { title: '分类分析' } },
      { path: 'finance-trend', name: 'TrendReport', component: TrendReport, meta: { title: '趋势报表' } },
      { path: 'finance-export', name: 'ExportCenter', component: ExportCenter, meta: { title: '导出中心' } },
      { path: 'settings-basic', name: 'BasicSettings', component: BasicSettings, meta: { title: '基础配置' } },
      { path: 'settings-category', name: 'CategoryManage', component: CategoryManage, meta: { title: '分类管理' } },
      { path: 'settings-message', name: 'MessageTemplate', component: MessageTemplate, meta: { title: '消息模板' } },
      { path: 'settings-log', name: 'OperationLog', component: OperationLog, meta: { title: '操作日志' } },
      { path: 'notifications', name: 'NotificationCenter', component: NotificationCenter, meta: { title: '消息中心' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
