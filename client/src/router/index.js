import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import UserList from '../views/admin/UserList.vue'
import AddUser from '../views/admin/AddUser.vue'
import BatchOperation from '../views/admin/BatchOperation.vue'
import RiskMonitor from '../views/admin/RiskMonitor.vue'
import FinanceStats from '../views/admin/FinanceStats.vue'
import CategoryAnalysis from '../views/admin/CategoryAnalysis.vue'
import TrendReport from '../views/admin/TrendReport.vue'
import ExportCenter from '../views/admin/ExportCenter.vue'
import BasicSettings from '../views/admin/BasicSettings.vue'
import CategoryManage from '../views/admin/CategoryManage.vue'
import MessageTemplate from '../views/admin/MessageTemplate.vue'
import OperationLog from '../views/admin/OperationLog.vue'
import NotificationCenter from '../views/admin/NotificationCenter.vue'

// 路由守卫 - 检查是否已登录
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token')
  if (token) {
    next()
  } else {
    next('/login')
  }
}

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    beforeEnter: requireAuth
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
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '数据概览' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户列表' }
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
      {
        path: 'risk',
        name: 'RiskMonitor',
        component: RiskMonitor,
        meta: { title: '风险监控' }
      },
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
