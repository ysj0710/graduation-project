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
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          class="nav-item"
          :class="{ active: currentPath === item.path }"
          @click.prevent="navigate(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card" @click="$router.push('/profile')">
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
          <p class="page-subtitle">{{ currentDate }}</p>
        </div>
        <div class="header-right">
          <el-button :icon="Search" circle />
          <el-button :icon="Bell" circle />
        </div>
      </header>

      <!-- 核心数据卡片 -->
      <div class="stats-grid">
        <div class="stat-card expense-card">
          <div class="stat-header">
            <span class="stat-label">本月支出</span>
            <span class="stat-trend up">↑ 12%</span>
          </div>
          <div class="stat-amount">¥{{ formatNumber(statistics.expense) }}</div>
          <div class="stat-budget">
            预算剩余 ¥{{ formatNumber(budgetRemaining) }}
          </div>
        </div>

        <div class="stat-card income-card">
          <div class="stat-header">
            <span class="stat-label">本月收入</span>
            <span class="stat-trend up">↑ 8%</span>
          </div>
          <div class="stat-amount income">
            ¥{{ formatNumber(statistics.income) }}
          </div>
          <div class="stat-budget">
            较上月 +¥{{ formatNumber(incomeChange) }}
          </div>
        </div>

        <div class="stat-card balance-card">
          <div class="stat-header">
            <span class="stat-label">本月结余</span>
            <span class="stat-badge">健康</span>
          </div>
          <div class="stat-amount balance">¥{{ formatNumber(balance) }}</div>
          <div class="stat-budget">储蓄率 {{ savingsRate }}%</div>
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
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
                <el-radio-button label="year">年</el-radio-button>
              </el-radio-group>
            </div>
            <div ref="trendChartRef" class="chart-container"></div>
          </div>

          <!-- 分类占比 -->
          <div class="ios-card">
            <div class="card-header">
              <h3>🥧 支出分类</h3>
            </div>
            <div class="category-grid">
              <div
                v-for="cat in categoryList"
                :key="cat.name"
                class="category-item"
              >
                <div
                  class="category-icon"
                  :style="{ background: cat.color + '15', color: cat.color }"
                >
                  {{ cat.icon }}
                </div>
                <div class="category-info">
                  <div class="category-name">{{ cat.name }}</div>
                  <div class="category-percent">{{ cat.percent }}%</div>
                </div>
                <div class="category-amount">
                  ¥{{ formatNumber(cat.amount) }}
                </div>
              </div>
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
          <div class="flex-1 px-5 py-4 border-r border-gray-100">
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
          <div class="flex-1 px-5 py-4">
            <div class="flex flex-col h-full">
              <div class="grid grid-cols-3 gap-1.5">
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
import * as echarts from "echarts";
import axios from "axios";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const currentPath = computed(() => route.path);
const pageTitle = computed(() => {
  const titles = {
    "/dashboard": "总览",
    "/transactions": "交易记录",
    "/statistics": "统计分析",
    "/accounts": "账户管理",
    "/personal": "个性设置",
    "/profile": "个人中心",
  };
  return titles[currentPath.value] || "总览";
});

const navItems = [
  { path: "/dashboard", icon: "🏠", label: "总览" },
  { path: "/transactions", icon: "📋", label: "交易记录" },
  { path: "/statistics", icon: "📊", label: "统计分析" },
  { path: "/accounts", icon: "💳", label: "账户管理" },
  { path: "/personal", icon: "🎨", label: "个性设置" },
];

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

const statistics = ref({ income: 0, expense: 0, balance: 0 });
const budgetRemaining = ref(5000);
const incomeChange = ref(1840);
const savingsRate = ref(49.7);
const recentRecords = ref([]);
const categoryList = ref([]);

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

const navigate = (path) => {
  router.push(path);
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
      "http://localhost:3000/api/transactions/month-stats",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    statistics.value = {
      income: res.data.income || 0,
      expense: res.data.expense || 0,
      balance: res.data.balance || 0,
    };

    budgetRemaining.value = userStore.budget.monthly - statistics.value.expense;
    savingsRate.value =
      statistics.value.income > 0
        ? Math.round((statistics.value.balance / statistics.value.income) * 100)
        : 0;

    // 获取最近交易
    const recordsRes = await axios.get(
      "http://localhost:3000/api/transactions",
      {
        params: { pageSize: 10 },
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    recentRecords.value = recordsRes.data.transactions || [];

    // 获取分类统计
    const statsRes = await axios.get(
      "http://localhost:3000/api/transactions/statistics",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const expenseCats = statsRes.data.byCategory?.expense || [];
    const totalExpense = expenseCats.reduce((sum, cat) => sum + cat.total, 0);

    categoryList.value = expenseCats.slice(0, 6).map((cat) => ({
      name: cat.category,
      amount: cat.total,
      percent:
        totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
      icon: getCategoryIcon(cat.category),
      color: "#FF3B30",
    }));

    await nextTick();
    renderChart();
  } catch (error) {
    console.error("获取数据失败:", error);
  }
};

const renderChart = () => {
  if (!trendChartRef.value) return;

  const chart = echarts.init(trendChartRef.value);
  const days = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
  const data = days.map(() => Math.floor(Math.random() * 5000));

  chart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: days,
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: data,
        itemStyle: {
          color: (params) => {
            return params.dataIndex >= 20 ? "#FF9500" : "#007AFF";
          },
        },
        barWidth: "60%",
      },
    ],
  });
};

onMounted(() => {
  userStore.fetchProfile();
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

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 14px;
  color: #8e8e93;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
}

.stat-trend.up {
  color: #34c759;
}

.stat-amount {
  font-size: 32px;
  font-weight: 700;
  color: #ff3b30;
}

.stat-amount.income {
  color: #34c759;
}

.stat-amount.balance {
  color: #007aff;
}

.stat-budget {
  font-size: 13px;
  color: #8e8e93;
  margin-top: 8px;
}

.stat-badge {
  background: #34c75915;
  color: #34c759;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
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

.chart-container {
  height: 280px;
}

/* 分类网格 */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #f5f5f7;
  transition: all 0.2s;
}

.category-item:hover {
  background: #e5e5ea;
}

.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.category-percent {
  font-size: 12px;
  color: #8e8e93;
}

.category-amount {
  font-size: 14px;
  font-weight: 600;
  color: #ff3b30;
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
</style>
