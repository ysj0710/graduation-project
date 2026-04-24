<template>
  <div class="app-container" :style="containerStyle">
    <!-- 左侧边栏导航 - iPad Pro 风格 -->
    <aside
      class="sidebar"
      :style="{ backdropFilter: `blur(${userStore.theme.glassBlur || 20}px)` }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">💰</span>
          <span class="logo-text">随手记</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentView === item.id }"
          @click="navigate(item)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.id === 'notifications' && unreadCount > 0" class="nav-badge">
            {{ unreadCount }}
          </span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card" @click="currentView = 'profile'">
          <el-avatar :size="40">{{
            userStore.profile.nickname?.charAt(0) || "U"
          }}</el-avatar>
          <div class="user-info">
            <div class="user-name">
              {{ userStore.profile.nickname || userStore.profile.username }}
            </div>
            <div class="user-role">普通用户</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p v-show="!showContent" class="page-subtitle">{{ currentDate }}</p>
        </div>
        <div class="header-right">
          <el-button :icon="Search" circle />
          <el-button :icon="Bell" circle />
        </div>
      </header>

      <!-- 内容区域 -->
      <div v-show="showContent" class="content-view">
        <component :is="currentComponent" />
      </div>

      <!-- 首页内容 -->
      <div v-show="!showContent">
      <!-- 统计卡片 - 升级版 -->
      <div class="stats-grid">
        <div class="stat-card expense-card">
          <div class="stat-card-bg"></div>
          <div class="stat-card-content">
            <div class="stat-icon expense-icon">
              <span class="icon-text">💳</span>
            </div>
            <div class="stat-info">
              <div class="stat-header">
                <span class="stat-label">本月支出</span>
                <span class="stat-trend" :class="expenseChange > 0 ? 'up' : (expenseChange < 0 ? 'down' : '')">
                  {{ expenseChange !== null ? (expenseChange > 0 ? '↑' : (expenseChange < 0 ? '↓' : '-')) : '--' }} {{ expenseChange !== null ? Math.abs(expenseChange) + '%' : '' }}
                </span>
              </div>
              <div class="stat-amount expense-amount">¥{{ formatNumber(statistics.expense) }}</div>
              <div class="stat-budget-bar">
                <div class="budget-progress">
                  <div class="budget-fill" :style="{ width: budgetUsagePercent + '%' }"></div>
                </div>
                <span class="budget-text">预算已用 {{ budgetUsagePercent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card income-card">
          <div class="stat-card-bg"></div>
          <div class="stat-card-content">
            <div class="stat-icon income-icon">
              <span class="icon-text">💰</span>
            </div>
            <div class="stat-info">
              <div class="stat-header">
                <span class="stat-label">本月收入</span>
                <span class="stat-trend" :class="incomeChange > 0 ? 'up' : (incomeChange < 0 ? 'down' : '')">
                  {{ incomeChange !== null ? (incomeChange > 0 ? '↑' : (incomeChange < 0 ? '↓' : '-')) : '--' }} {{ incomeChange !== null ? Math.abs(incomeChange) + '%' : '' }}
                </span>
              </div>
              <div class="stat-amount income-amount">¥{{ formatNumber(statistics.income) }}</div>
              <div class="stat-budget-bar">
                <span class="budget-text income-text">较上月 {{ incomeChange !== null ? (incomeChange >= 0 ? '+' : '') + incomeChange + '%' : '--' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card balance-card">
          <div class="stat-card-bg"></div>
          <div class="stat-card-content">
            <div class="stat-icon balance-icon">
              <span class="icon-text">📊</span>
            </div>
            <div class="stat-info">
              <div class="stat-header">
                <span class="stat-label">本月结余</span>
                <span class="stat-badge" :class="statistics.balance >= 0 ? 'positive' : 'negative'">{{ statistics.balance >= 0 ? '健康' : '超支' }}</span>
              </div>
              <div class="stat-amount balance-amount">¥{{ formatNumber(statistics.balance) }}</div>
              <div class="stat-budget-bar">
                <div class="budget-progress">
                  <div class="budget-fill savings" :style="{ width: Math.min(savingsRate, 100) + '%' }"></div>
                </div>
                <span class="budget-text">储蓄率 {{ savingsRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 消费热力图 -->
      <div class="heatmap-card ios-card" v-if="dailyExpenseData.length > 0">
        <div class="card-header">
          <h3>🗓️ 消费热力图</h3>
          <div class="heatmap-controls">
            <el-button size="small" circle @click="prevMonth" :icon="ArrowLeftBold" />
            <span class="heatmap-month">{{ heatmapYear }}年{{ heatmapMonth }}月</span>
            <el-button size="small" circle @click="nextMonth" :icon="ArrowRightBold" />
          </div>
          <div class="heatmap-legend">
            <span>少</span>
            <div class="legend-bar">
              <div class="legend-cell" style="background: #E8F5E9"></div>
              <div class="legend-cell" style="background: #A5D6A7"></div>
              <div class="legend-cell" style="background: #66BB6A"></div>
              <div class="legend-cell" style="background: #2E7D32"></div>
              <div class="legend-cell" style="background: #1B5E20"></div>
            </div>
            <span>多</span>
          </div>
        </div>
        <div class="heatmap-grid">
          <div class="heatmap-weekday">日</div>
          <div class="heatmap-weekday">一</div>
          <div class="heatmap-weekday">二</div>
          <div class="heatmap-weekday">三</div>
          <div class="heatmap-weekday">四</div>
          <div class="heatmap-weekday">五</div>
          <div class="heatmap-weekday">六</div>
          <div
            v-for="cell in heatmapCells"
            :key="cell.date"
            class="heatmap-cell"
            :class="cell.class"
            :title="cell.date + ': ¥' + cell.amount"
          >
            <span class="cell-day">{{ cell.day }}</span>
          </div>
        </div>
      </div>

      <!-- 中间内容区 -->
      <div class="content-grid">
        <!-- 左侧：图表区域 -->
        <div class="charts-section">
          <!-- 支出趋势图 -->
          <div class="ios-card">
            <div class="card-header">
              <h3>📊 每日消费</h3>
              <el-radio-group
                v-model="timeRange"
                size="small"
                @change="fetchData"
              >
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
                <el-radio-button value="year">年</el-radio-button>
              </el-radio-group>
            </div>
            <div ref="trendChartRef" class="chart-container"></div>
          </div>

          <!-- 分类占比 -->
          <div class="ios-card">
            <div class="card-header">
              <h3>🥧 {{ categoryType === 'expense' ? '支出分类' : '收入分类' }}</h3>
              <el-radio-group v-model="categoryType" size="small">
                <el-radio-button value="expense">支出</el-radio-button>
                <el-radio-button value="income">收入</el-radio-button>
              </el-radio-group>
            </div>
            <div class="category-chart-container">
              <div ref="categoryPieRef" class="category-pie-chart"></div>
            </div>
          </div>
        </div>

        <!-- 右侧：最近交易 -->
        <div class="transactions-section">
          <div class="ios-card">
            <div class="card-header">
              <h3>📝 最近交易</h3>
              <el-button
                type="primary"
                size="small"
                @click="$router.push('/transactions')"
                >查看全部</el-button
              >
            </div>
            <div class="transactions-list">
              <div
                v-for="record in recentRecords"
                :key="record._id"
                class="transaction-item"
              >
                <div
                  class="transaction-icon"
                  :style="{
                    background:
                      record.type === 'income' ? '#34C75915' : '#FF3B3015',
                    color: record.type === 'income' ? '#34C759' : '#FF3B30',
                  }"
                >
                  {{ getCategoryIcon(record.category) }}
                </div>
                <div class="transaction-info">
                  <div class="transaction-title">{{ record.category }}</div>
                  <div class="transaction-time">
                    {{ formatTime(record.date) }}
                  </div>
                </div>
                <div class="transaction-amount" :class="record.type">
                  {{ record.type === "income" ? "+" : "-" }}¥{{
                    formatNumber(record.amount)
                  }}
                </div>
              </div>
              <el-empty
                v-if="recentRecords.length === 0"
                description="暂无记录"
                :image-size="60"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>

    <!-- 悬浮记账按钮 -->
    <button class="fab-button" @click="showAddSheet = true">
      <span>+</span>
    </button>

    <!-- 记账底部面板 -->
    <el-drawer
      v-model="showAddSheet"
      title="记一笔"
      direction="btt"
      size="75vh"
      :show-close="false"
      class="add-sheet-drawer"
    >
      <div class="add-sheet">
        <!-- 类型切换 -->
        <div class="type-toggle">
          <button
            :class="['type-btn', { active: record.type === 'expense' }]"
            @click="record.type = 'expense'"
          >
            支出
          </button>
          <button
            :class="['type-btn', { active: record.type === 'income' }]"
            @click="record.type = 'income'"
          >
            收入
          </button>
        </div>

        <!-- 双栏布局 -->
        <div class="flex flex-1">
          <!-- 左侧：金额 + 数字键盘 -->
          <div class="flex-1 px-5 py-4 border-r border-gray-100 overflow-y-auto">
            <div class="flex flex-col h-full">
              <div class="text-center p-4 bg-gray-50 rounded-xl h-20">
                <span class="text-gray-400 text-lg mr-1">¥</span>
                <span
                  class="text-2xl font-bold"
                  :class="
                    record.type === 'expense'
                      ? 'text-red-500'
                      : 'text-green-500'
                  "
                  >{{ displayAmount }}</span
                >
              </div>
              <div class="mt-3 flex-1 flex flex-col justify-start">
                <div class="flex gap-2 mb-2">
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('1')"
                  >
                    1
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('2')"
                  >
                    2
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('3')"
                  >
                    3
                  </button>
                </div>
                <div class="flex gap-2 mb-2">
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('4')"
                  >
                    4
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('5')"
                  >
                    5
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('6')"
                  >
                    6
                  </button>
                </div>
                <div class="flex gap-2 mb-2">
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('7')"
                  >
                    7
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('8')"
                  >
                    8
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('9')"
                  >
                    9
                  </button>
                </div>
                <div class="flex gap-2">
                  <button
                    class="flex-1 h-17 bg-gray-50 rounded-lg text-base active:scale-95 transition-transform"
                    @click="inputDigit('.')"
                  >
                    .
                  </button>
                  <button
                    class="flex-1 h-20 bg-gray-50 rounded-lg text-xl font-medium active:scale-95 transition-transform"
                    @click="inputDigit('0')"
                  >
                    0
                  </button>
                  <button
                    class="flex-1 h-17 bg-gray-50 rounded-lg text-base active:scale-95 transition-transform"
                    @click="deleteDigit"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：分类 + 备注 + 确认 -->
          <div class="flex-1 px-5 py-4 overflow-y-auto">
            <div class="flex flex-col h-full">
              <div class="grid grid-cols-3 gap-1.5 mb-3">
                <div
                  v-for="cat in currentCategories.slice(0, 9)"
                  :key="cat.id"
                  class="flex flex-col items-center h-20 gap-0.5 py-2 rounded-lg bg-gray-50 cursor-pointer transition-all"
                  :class="
                    record.category === cat.name
                      ? 'text-white'
                      : 'hover:bg-gray-100'
                  "
                  :style="
                    record.category === cat.name
                      ? { backgroundColor: cat.color }
                      : {}
                  "
                  @click="record.category = cat.name"
                >
                  <span class="text-lg">{{ cat.icon }}</span>
                  <span class="text-xs font-medium">{{ cat.name }}</span>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <input
                  v-model="record.note"
                  type="text"
                  placeholder="添加备注..."
                  class="h-20 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none"
                />
                <button
                  class="h-20 w-full bg-gradient-to-br from-green-500 to-green-400 rounded-xl text-white text-lg font-medium shadow-lg shadow-green-400/30 active:scale-95 transition-transform flex items-center justify-center"
                  @click="saveRecord"
                >
                  完成记账
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../../stores/user";
import { Search, Bell } from "@element-plus/icons-vue";
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import axios from "axios";

// 引入子页面组件
import Transactions from "./Transactions.vue";
import Statistics from "./Statistics.vue";
import ConsumptionAnalysis from "./ConsumptionAnalysis.vue";
import Personal from "./Personal.vue";
import Profile from "./Profile.vue";
import Notifications from "./Notifications.vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 当前显示的页面
const currentView = ref("dashboard");

const pageTitle = computed(() => {
  const titles = {
    dashboard: "总览",
    transactions: "交易记录",
    statistics: "统计分析",
    consumption: "消费分析",
    personal: "个性设置",
    profile: "个人中心",
    notifications: "消息中心",
  };
  return titles[currentView.value] || "总览";
});

const navItems = [
  { id: "dashboard", icon: "🏠", label: "总览" },
  { id: "transactions", icon: "📋", label: "交易记录" },
  { id: "statistics", icon: "📊", label: "统计分析" },
  { id: "consumption", icon: "📈", label: "消费分析" },
  { id: "personal", icon: "🎨", label: "个性设置" },
  { id: "notifications", icon: "🔔", label: "消息中心" },
];

// 组件映射
const components = {
  dashboard: null,
  transactions: Transactions,
  statistics: Statistics,
  consumption: ConsumptionAnalysis,
  personal: Personal,
  profile: Profile,
  notifications: Notifications,
};

const currentComponent = computed(() => components[currentView.value]);
const showContent = computed(() => currentView.value !== "dashboard");

const currentDate = ref(
  new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
);
const timeRange = ref("month");
const showAddSheet = ref(false);
const trendChartRef = ref(null);
const categoryPieRef = ref(null);

// 热力图当前选中的年月
const now = new Date();
const heatmapYear = ref(now.getFullYear());
const heatmapMonth = ref(now.getMonth() + 1);

const statistics = ref({ income: 0, expense: 0, balance: 0 });
const budgetRemaining = ref(5000);
const incomeChange = ref(0);
const savingsRate = ref(49.7);
const expenseChange = ref(0);
const recentRecords = ref([]);
const dailyExpenseData = ref([]);
const categoryType = ref('expense');
const categoryList = ref([]);
let categoryPieChart = null;

// 预算使用百分比
const budgetUsagePercent = computed(() => {
  const budget = userStore.budget.monthly || 0;
  if (budget === 0) return 0;
  return Math.min(Math.round((statistics.value.expense / budget) * 100), 100);
});

// 热力图数据
const heatmapCells = computed(() => {
  const year = heatmapYear.value;
  const month = heatmapMonth.value - 1; // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 计算每日最大支出用于颜色分级
  const maxDaily = Math.max(...dailyExpenseData.value.map(d => d.amount), 1);

  const cells = [];

  // 获取该月1号是周几
  const firstDay = new Date(year, month, 1).getDay();

  // 填充空白（该月1号之前的空白格）
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: '', day: '', amount: 0, class: 'empty' });
  }

  // 填充该月每一天
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daily = dailyExpenseData.value.find(d => d.date === dateStr);
    const amount = daily?.amount || 0;

    // 根据支出金额分级
    let colorClass = 'low';
    if (amount === 0) {
      colorClass = 'zero';
    } else if (amount / maxDaily > 0.75) {
      colorClass = 'high';
    } else if (amount / maxDaily > 0.5) {
      colorClass = 'medium-high';
    } else if (amount / maxDaily > 0.25) {
      colorClass = 'medium';
    } else {
      colorClass = 'low';
    }

    cells.push({
      date: dateStr,
      day: day,
      amount: Math.round(amount * 100) / 100,
      class: colorClass
    });
  }

  return cells;
});

// 切换月份
const prevMonth = () => {
  heatmapMonth.value--;
  if (heatmapMonth.value < 1) {
    heatmapMonth.value = 12;
    heatmapYear.value--;
  }
  fetchHeatmapData();
};

const nextMonth = () => {
  const now = new Date();
  if (heatmapYear.value === now.getFullYear() && heatmapMonth.value === now.getMonth() + 1) return; // 不能超过当前月
  heatmapMonth.value++;
  if (heatmapMonth.value > 12) {
    heatmapMonth.value = 1;
    heatmapYear.value++;
  }
  fetchHeatmapData();
};

// 获取指定月份的热力图数据
const fetchHeatmapData = async () => {
  try {
    const token = localStorage.getItem('token');
    const year = heatmapYear.value;
    const month = heatmapMonth.value;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const res = await axios.get(
      `https://ysj0710.xyz/api/transactions/daily-stats`,
      {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    dailyExpenseData.value = res.data || [];
  } catch (error) {
    console.error('获取热力图数据失败:', error);
  }
};

const record = ref({
  type: "expense",
  amount: "",
  category: "餐饮",
  note: "",
  date: new Date().toISOString().split("T")[0],
});

const displayAmount = computed(() => {
  return record.value.amount || "0.00";
});

const currentCategories = computed(() => {
  return record.value.type === "income"
    ? userStore.categories.income
    : userStore.categories.expense;
});

// 主题背景样式
const containerStyle = computed(() => ({
  background:
    userStore.theme.background ||
    "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
}));

// 浮点计算工具函数
const precisionAdd = (...nums) => {
  return nums.reduce((sum, num) => sum + num, 0);
};

const precisionSub = (a, b) => {
  return a - b;
};

const precisionMul = (...nums) => {
  return nums.reduce((product, num) => product * num, 1);
};

const precisionDiv = (a, b) => {
  return b === 0 ? 0 : a / b;
};

const formatNumber = (num) => {
  return Number(num || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 86400000) return "今天";
  if (diff < 172800000) return "昨天";
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const getCategoryIcon = (category) => {
  const icons = {
    餐饮: "🍜",
    交通: "🚗",
    购物: "🛍️",
    娱乐: "🎮",
    住房: "🏠",
    医疗: "💊",
    教育: "📚",
    其他: "📦",
    工资: "💰",
    奖金: "🎁",
    理财: "📈",
    兼职: "💼",
    其他收入: "💵",
  };
  return icons[category] || "💰";
};

// 未读消息数量
const unreadCount = ref(0);

// 获取未读消息数量
const fetchUnreadCount = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    unreadCount.value = res.data.count || 0;
  } catch (error) {
    console.error('获取未读数量失败:', error);
  }
};

const navigate = (item) => {
  currentView.value = item.id;
};

const inputDigit = (digit) => {
  if (digit === ".") {
    if (record.value.amount.includes(".")) return;
    record.value.amount = record.value.amount
      ? record.value.amount + "."
      : "0.";
  } else if (digit === "00") {
    if (!record.value.amount) return;
    record.value.amount += "00";
  } else {
    if (record.value.amount === "0") {
      record.value.amount = digit;
    } else {
      record.value.amount += digit;
    }
  }
};

const deleteDigit = () => {
  if (record.value.amount.length > 1) {
    record.value.amount = record.value.amount.slice(0, -1);
  } else {
    record.value.amount = "";
  }
};

const setToday = () => {
  record.value.date = new Date().toISOString().split("T")[0];
};

const saveRecord = async () => {
  const amount = parseFloat(record.value.amount);
  if (!amount || amount <= 0) return;

  try {
    await userStore.addRecord({
      type: record.value.type,
      amount: amount,
      category: record.value.category,
      note: record.value.note,
      date: record.value.date,
    });

    // 重置表单
    record.value.amount = "";
    record.value.note = "";
    showAddSheet.value = false;

    // 刷新数据
    fetchData();
  } catch (error) {
    console.error("保存失败:", error);
  }
};

const fetchData = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "https://ysj0710.xyz/api/transactions/month-stats",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    statistics.value = {
      income: res.data.income || 0,
      expense: res.data.expense || 0,
      balance: precisionSub(res.data.income || 0, res.data.expense || 0),
    };
    console.log('month-stats response:', res.data);

    // 计算预算剩余
    budgetRemaining.value = precisionSub(userStore.budget.monthly || 0, statistics.value.expense);
    
    // 计算储蓄率
    savingsRate.value = statistics.value.income > 0
      ? Math.round(precisionMul(precisionDiv(statistics.value.balance, statistics.value.income), 100))
      : 0;
    
    // 计算收入和支出变化百分比
    incomeChange.value = res.data.incomeChange !== undefined ? res.data.incomeChange : 0;
    expenseChange.value = res.data.expenseChange !== undefined ? res.data.expenseChange : 0;

    // 获取最近交易
    const recordsRes = await axios.get(
      "https://ysj0710.xyz/api/transactions",
      {
        params: { pageSize: 10 },
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    recentRecords.value = recordsRes.data.transactions || [];

    // 获取分类统计
    const statsRes = await axios.get(
      "https://ysj0710.xyz/api/transactions/statistics",
      {
        params: { type: categoryType.value },
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const expenseCats = statsRes.data.byCategory?.[categoryType.value] || [];
    const totalAmount = expenseCats.reduce((sum, cat) => sum + cat.total, 0);

    categoryList.value = expenseCats.slice(0, 6).map((cat) => ({
      name: cat.category,
      amount: cat.total,
      percent: totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100) : 0,
      icon: getCategoryIcon(cat.category),
      color: categoryType.value === 'expense' ? "#FF3B30" : "#34C759",
    }));

    // 获取本月每日支出数据（用于热力图）
    const dailyRes = await axios.get(
      "https://ysj0710.xyz/api/transactions/daily-stats",
      {
        params: { range: 'month' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    dailyExpenseData.value = dailyRes.data || [];
    
    // 渲染饼图
    await nextTick();
    renderCategoryPie();

    renderChart();
  } catch (error) {
    console.error("获取数据失败:", error);
  }
};

// 渲染分类饼图
const renderCategoryPie = () => {
  if (!categoryPieRef.value) return;
  
  // 销毁已有图表
  if (categoryPieChart) {
    categoryPieChart.dispose();
  }
  
  const chartData = categoryList.value.map(cat => ({
    name: cat.name,
    value: cat.amount
  }));
  
  categoryPieChart = echarts.init(categoryPieRef.value);
  
  const colors = categoryType.value === 'expense' 
    ? ['#FF3B30', '#FF6B6B', '#FF8E53', '#FFB347', '#FFD700', '#C0C0C0']
    : ['#34C759', '#50C878', '#3CB371', '#2E8B57', '#20B2AA', '#C0C0C0'];
  
  categoryPieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 13 }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 10
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 15,
            fontWeight: 'bold'
          },
          scaleSize: 8
        },
        labelLine: {
          show: false
        },
        data: chartData,
        color: colors,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx) => idx * 80
      }
    ]
  });
};

const renderChart = async () => {
  if (!trendChartRef.value) return;

  try {
    const token = localStorage.getItem("token");
    const range = timeRange.value;
    
    // 从 API 获取每日消费数据
    const res = await axios.get(
      `https://ysj0710.xyz/api/transactions/daily-stats?range=${range}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = res.data || [];
    
    // 根据 range 决定显示格式
    let days, chartData;
    if (range === 'week') {
      days = data.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      chartData = data.map(item => item.amount);
    } else if (range === 'year') {
      // 按月汇总
      const monthMap = {};
      data.forEach(item => {
        const month = item.date.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + item.amount;
      });
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      days = months;
      chartData = months.map((_, i) => monthMap[`${new Date().getFullYear()}-${String(i+1).padStart(2, '0')}`] || 0);
    } else {
      // 月（默认）
      days = data.map(item => {
        const day = parseInt(item.date.split('-')[2]);
        return `${day}日`;
      });
      chartData = data.map(item => item.amount);
    }

    // 销毁已有图表实例
    if (trendChartRef.value) {
      echarts.getInstanceByDom(trendChartRef.value)?.dispose();
    }

    const chart = echarts.init(trendChartRef.value);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#eee",
        borderWidth: 1,
        textStyle: { color: "#333", fontSize: 13 },
        formatter: params => {
          const val = params[0]?.value || 0;
          return `${params[0]?.axisValue}<br/><b>支出: ¥${formatNumber(val)}</b>`;
        }
      },
      grid: { left: "3%", right: "4%", bottom: "3%", top: "8%", containLabel: true },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { fontSize: 11, color: "#8E8E93" },
        axisLine: { lineStyle: { color: "#E5E5EA" } },
        axisTick: { show: false }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 11,
          color: "#8E8E93",
          formatter: val => val >= 1000 ? `¥${(val / 1000).toFixed(1)}k` : `¥${val}`
        },
        splitLine: { lineStyle: { color: "#F0F0F5", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          type: "bar",
          data: chartData,
          barWidth: "55%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#FF6B6B" },
              { offset: 0.5, color: "#FF3B30" },
              { offset: 1, color: "#E84545" }
            ]),
            borderRadius: [6, 6, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#FF8E8E" },
                { offset: 1, color: "#FF6B6B" }
              ]),
              shadowBlur: 10,
              shadowColor: "rgba(255, 59, 48, 0.3)"
            }
          },
          showBackground: true,
          backgroundStyle: {
            color: "#F5F5F7",
            borderRadius: [6, 6, 0, 0]
          },
          animationDuration: 1000,
          animationEasing: "cubicOut"
        }
      ]
    });
  } catch (error) {
    console.error("获取图表数据失败:", error);
  }
};

onMounted(() => {
  userStore.fetchProfile();
  fetchData();
  fetchUnreadCount();
  
  // 每30秒刷新一次未读消息数量
  setInterval(fetchUnreadCount, 30000);
});

// 监听页面切换，切换回总览时重新加载数据
watch(currentView, (newVal) => {
  if (newVal === 'dashboard') {
    fetchData();
  }
});

watch(categoryType, () => {
  fetchData();
});

// 监听主题变化
watch(
  () => userStore.theme,
  (newTheme) => {
    // 主题变化时会自动通过 computed containerStyle 更新
  },
  { deep: true },
);
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f5f5f7;
  transition: background 0.5s ease;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: backdrop-filter 0.3s ease;
}

.sidebar-header {
  padding: 32px 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  color: #000;
}

.sidebar-nav {
  flex: 1;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  color: #8e8e93;
  text-decoration: none;
  margin: 4px 0;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(0, 122, 255, 0.1);
}

.nav-item.active {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-size: 15px;
  font-weight: 500;
}

.nav-badge {
  margin-left: auto;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #FF3B30;
  color: white;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e5e5ea;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-card:hover {
  background: #f2f2f7;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.user-role {
  font-size: 12px;
  color: #8e8e93;
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 32px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.page-subtitle {
  font-size: 15px;
  color: #8e8e93;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 内容区域 */
.content-view {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  min-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* 统计卡片 - 升级版 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  min-height: 160px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.stat-card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.95;
  z-index: 0;
}

.expense-card .stat-card-bg {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF3B30 50%, #E84545 100%);
}

.income-card .stat-card-bg {
  background: linear-gradient(135deg, #50C878 0%, #34C759 50%, #28A745 100%);
}

.balance-card .stat-card-bg {
  background: linear-gradient(135deg, #6C8FFF 0%, #007AFF 50%, #0056D6 100%);
}

.stat-card-content {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  height: 100%;
  box-sizing: border-box;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
}

.icon-text {
  font-size: 28px;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.stat-trend.up {
  color: #FFEB3B;
}

.stat-trend.down {
  color: #C8E6C9;
}

.stat-amount {
  font-size: 30px;
  font-weight: 800;
  color: white;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.expense-amount { color: #FFFFFF; }
.income-amount { color: #FFFFFF; }
.balance-amount { color: #FFFFFF; }

.stat-budget-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.budget-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.budget-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFE066 0%, #FFD93D 50%, #FFC107 100%);
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
}

.budget-fill.savings {
  background: linear-gradient(90deg, #C8E6C9 0%, #81C784 50%, #4CAF50 100%);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
}

.budget-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.stat-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.stat-badge.positive {
  background: rgba(200, 230, 201, 0.3);
  color: #E8F5E9;
}

.stat-badge.negative {
  background: rgba(255, 205, 210, 0.3);
  color: #FFE0E0;
}

/* 内容区 */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.transactions-section {
  display: flex;
  flex-direction: column;
}

/* 卡片样式 */
.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: #000;
  margin: 0;
}

/* 热力图 */
.heatmap-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.heatmap-month {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  min-width: 100px;
  text-align: center;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8E8E93;
}

.legend-bar {
  display: flex;
  gap: 3px;
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.heatmap-weekday {
  text-align: center;
  font-size: 12px;
  color: #8E8E93;
  font-weight: 500;
  padding-bottom: 4px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  color: #fff;
}

.heatmap-cell:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.heatmap-cell.empty {
  background: transparent;
  cursor: default;
}

.heatmap-cell.empty:hover {
  transform: none;
  box-shadow: none;
}

.heatmap-cell.zero {
  background: #F5F5F7;
  color: #C7C7CC;
}

.heatmap-cell.low {
  background: #E8F5E9;
  color: #2E7D32;
}

.heatmap-cell.medium {
  background: #A5D6A7;
  color: #1B5E20;
}

.heatmap-cell.medium-high {
  background: #66BB6A;
  color: #fff;
}

.heatmap-cell.high {
  background: #1B5E20;
  color: #fff;
}

.cell-day {
  font-size: 11px;
}

.chart-container {
  height: 280px;
}

/* 分类网格 */
.category-chart-container {
  width: 100%;
  height: 300px;
}

.category-pie-chart {
  width: 100%;
  height: 100%;
}

/* 交易列表 */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #f5f5f7;
}

.transaction-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.transaction-time {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 2px;
}

.transaction-amount {
  font-size: 15px;
  font-weight: 700;
}

.transaction-amount.expense {
  color: #ff3b30;
}

.transaction-amount.income {
  color: #34c759;
}

/* 悬浮按钮 - 更明显的记账按钮 */
.fab-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  border: none;
  color: white;
  font-size: 28px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(52, 199, 89, 0.45);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 90;
}

.fab-button::before {
  content: "记一笔";
  position: absolute;
  top: -36px;
  background: white;
  color: #34c759;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
}

.fab-button::after {
  content: "";
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(52, 199, 89, 0.3);
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.fab-button:hover {
  transform: scale(1.08);
}

.fab-button:hover::before {
  opacity: 1;
  transform: translateY(0);
}

.fab-button:active {
  transform: scale(0.95);
}

/* 记账面板 */
.add-sheet {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.type-toggle {
  display: flex;
  background: #e5e5ea;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #8e8e93;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  background: white;
  color: #000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.amount-display {
  text-align: center;
  padding: 20px;
  background: #f5f5f7;
  border-radius: 16px;
  margin-bottom: 20px;
}

.amount-display .currency {
  font-size: 20px;
  color: #8e8e93;
  margin-right: 4px;
}

.amount-display .amount {
  font-size: 42px;
  font-weight: 700;
  color: #000;
}

.amount-display .amount.expense {
  color: #ff3b30;
}

.amount-display .amount.income {
  color: #34c759;
}

.category-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  color: #8e8e93;
  margin-bottom: 12px;
}

.category-select-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.category-select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 14px;
  background: #f5f5f7;
  cursor: pointer;
  transition: all 0.2s;
}

.category-select-item.active {
  background: var(--cat-color);
  color: white;
}

.category-select-item .cat-icon {
  font-size: 22px;
}

.category-select-item .cat-name {
  font-size: 11px;
  font-weight: 500;
}

/* 样式已使用 Tailwind CSS */

/* 数字键盘 */
.number-keypad {
  margin-top: auto;
}

.keypad-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.keypad-btn {
  flex: 1;
  height: 56px;
  border: none;
  border-radius: 14px;
  background: #f5f5f7;
  font-size: 22px;
  font-weight: 500;
  color: #000;
  cursor: pointer;
  transition: all 0.15s;
}

.keypad-btn:active {
  background: #e5e5ea;
}

.keypad-btn.delete,
.keypad-btn.action {
  background: #e5e5ea;
  color: #8e8e93;
  font-size: 14px;
}

.keypad-btn.confirm {
  background: #34c759;
  color: white;
}

.keypad-btn.confirm:active {
  background: #2aaf55;
}

/* 自定义记账面板样式 - 双栏布局 */
.add-sheet-drawer {
  --el-drawer-padding-primary: 0;
}

.add-sheet-drawer .el-drawer__body {
  padding: 0 !important;
}

.add-sheet {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 28px 28px 0 0;
  overflow: hidden;
}

.add-sheet .type-toggle {
  /* 类型切换按钮 */
  .type-btn {
    flex: 1;
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #8e8e93;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-btn.active {
    background: #f5f5f7;
    color: #007aff;
  }

  .type-btn:first-child.active {
    background: rgba(255, 59, 48, 0.15);
    color: #ff3b30;
  }

  .type-btn:last-child.active {
    background: rgba(52, 199, 89, 0.15);
    color: #34c759;
  }
}

/* 内容切换动画 */
.content-view {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
