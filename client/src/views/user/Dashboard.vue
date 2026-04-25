<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card expense">
        <div class="stat-icon">
          <CreditCard :size="24" :stroke-width="1.8" />
        </div>
        <div class="stat-info">
          <div class="stat-header">
            <span class="stat-label">本月支出</span>
            <span
              class="stat-trend"
              :class="
                expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : ''
              "
            >
              {{
                expenseChange !== null
                  ? expenseChange > 0
                    ? "↑"
                    : expenseChange < 0
                      ? "↓"
                      : "-"
                  : "--"
              }}
              {{ expenseChange !== null ? Math.abs(expenseChange) + "%" : "" }}
            </span>
          </div>
          <div class="stat-amount">¥{{ formatNumber(statistics.expense) }}</div>
          <div class="stat-budget">
            <div class="budget-progress">
              <div
                class="budget-fill"
                :style="{ width: budgetUsagePercent + '%' }"
              ></div>
            </div>
            <span>预算已用 {{ budgetUsagePercent }}%</span>
          </div>
        </div>
      </div>

      <div class="stat-card income">
        <div class="stat-icon"><Wallet :size="24" :stroke-width="1.8" /></div>
        <div class="stat-info">
          <div class="stat-header">
            <span class="stat-label">本月收入</span>
            <span
              class="stat-trend"
              :class="incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : ''"
            >
              {{
                incomeChange !== null
                  ? incomeChange > 0
                    ? "↑"
                    : incomeChange < 0
                      ? "↓"
                      : "-"
                  : "--"
              }}
              {{ incomeChange !== null ? Math.abs(incomeChange) + "%" : "" }}
            </span>
          </div>
          <div class="stat-amount">¥{{ formatNumber(statistics.income) }}</div>
          <div class="stat-budget">
            <span
              >较上月
              {{
                incomeChange !== null
                  ? (incomeChange >= 0 ? "+" : "") + incomeChange + "%"
                  : "--"
              }}</span
            >
          </div>
        </div>
      </div>

      <div class="stat-card balance">
        <div class="stat-icon">
          <BarChart3 :size="24" :stroke-width="1.8" />
        </div>
        <div class="stat-info">
          <div class="stat-header">
            <span class="stat-label">本月结余</span>
            <span
              class="stat-badge"
              :class="statistics.balance >= 0 ? 'positive' : 'negative'"
              >{{ statistics.balance >= 0 ? "健康" : "超支" }}</span
            >
          </div>
          <div class="stat-amount">¥{{ formatNumber(statistics.balance) }}</div>
          <div class="stat-budget">
            <div class="budget-progress">
              <div
                class="budget-fill savings"
                :style="{ width: Math.min(savingsRate, 100) + '%' }"
              ></div>
            </div>
            <span>储蓄率 {{ savingsRate }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 消费热力图 + 分类饼图 -->
    <div class="card heatmap-card" v-if="dailyExpenseData.length > 0">
      <div class="heatmap-content">
        <div class="heatmap-section">
          <div class="card-header compact">
            <div class="card-title">
              <Calendar :size="18" :stroke-width="1.5" /><span>消费热力图</span>
            </div>
            <div class="heatmap-controls">
              <button class="icon-btn small" @click="prevMonth">
                <ChevronLeft :size="16" />
              </button>
              <span class="heatmap-month"
                >{{ heatmapYear }}年{{ heatmapMonth }}月</span
              >
              <button class="icon-btn small" @click="nextMonth">
                <ChevronRight :size="16" />
              </button>
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
              <span v-if="cell.day">{{ cell.day }}</span>
            </div>
          </div>
          <div class="heatmap-legend">
            <span>少</span>
            <div class="legend-bar">
              <div class="legend-cell" style="background: #ebedf0"></div>
              <div class="legend-cell" style="background: #9be9a8"></div>
              <div class="legend-cell" style="background: #40c463"></div>
              <div class="legend-cell" style="background: #30a14e"></div>
              <div class="legend-cell" style="background: #216e39"></div>
            </div>
            <span>多</span>
          </div>
        </div>
        <div class="pie-section">
          <div class="card-header compact">
            <div class="card-title">
              <PieChart :size="18" :stroke-width="1.5" /><span>{{
                categoryType === "expense" ? "支出分类" : "收入分类"
              }}</span>
            </div>
            <div class="btn-group">
              <button
                class="btn small"
                :class="{ active: categoryType === 'expense' }"
                @click="
                  categoryType = 'expense';
                  fetchData();
                "
              >
                支出
              </button>
              <button
                class="btn small"
                :class="{ active: categoryType === 'income' }"
                @click="
                  categoryType = 'income';
                  fetchData();
                "
              >
                收入
              </button>
            </div>
          </div>
          <div ref="categoryPieRef" class="pie-area"></div>
        </div>
      </div>
    </div>

    <!-- 图表和交易列表 -->
    <div class="content-grid">
      <div class="charts-section">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <TrendingUp :size="18" :stroke-width="1.5" /><span>消费趋势</span>
            </div>
            <div class="btn-group">
              <button
                class="btn small"
                :class="{ active: timeRange === 'week' }"
                @click="
                  timeRange = 'week';
                  fetchData();
                "
              >
                周
              </button>
              <button
                class="btn small"
                :class="{ active: timeRange === 'month' }"
                @click="
                  timeRange = 'month';
                  fetchData();
                "
              >
                月
              </button>
              <button
                class="btn small"
                :class="{ active: timeRange === 'year' }"
                @click="
                  timeRange = 'year';
                  fetchData();
                "
              >
                年
              </button>
            </div>
          </div>
          <div ref="trendChartRef" class="chart-area"></div>
        </div>
        <div class="card budget-progress-card">
          <div class="card-header compact">
            <div class="card-title">
              <CreditCard :size="18" :stroke-width="1.5" /><span>预算进度</span>
            </div>
          </div>
          <div class="budget-detail">
            <div class="budget-amounts">
              <div class="budget-item">
                <span class="budget-label">已消费</span
                ><span class="budget-value expense"
                  >¥{{ formatNumber(statistics.expense) }}</span
                >
              </div>
              <div class="budget-item">
                <span class="budget-label">预算余额</span
                ><span
                  class="budget-value"
                  :class="
                    userStore.budget.monthly - statistics.expense >= 0
                      ? 'income'
                      : 'expense'
                  "
                  >¥{{
                    formatNumber(
                      Math.max(
                        0,
                        userStore.budget.monthly - statistics.expense,
                      ),
                    )
                  }}</span
                >
              </div>
            </div>
            <div class="progress-ring-container">
              <div
                class="progress-ring"
                :style="{ '--progress': budgetUsagePercent + '%' }"
              >
                <div class="progress-ring-inner">
                  <span class="progress-percent"
                    >{{ budgetUsagePercent }}%</span
                  >
                  <span class="progress-label">已用</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card transactions-card">
        <div class="card-header">
          <div class="card-title">
            <ListOrdered :size="18" :stroke-width="1.5" /><span>最近交易</span>
          </div>
          <button
            class="btn small primary"
            @click="$router.push('/transactions')"
          >
            查看全部
          </button>
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
                  record.type === 'income'
                    ? 'var(--color-income-bg)'
                    : 'var(--color-expense-bg)',
                color:
                  record.type === 'income'
                    ? 'var(--color-income)'
                    : 'var(--color-expense)',
              }"
            >
              <CategoryIcon :name="record.category" :size="20" />
            </div>
            <div class="transaction-info">
              <div class="transaction-title">{{ record.category }}</div>
              <div class="transaction-time">{{ formatTime(record.date) }}</div>
            </div>
            <div class="transaction-amount" :class="record.type">
              {{ record.type === "income" ? "+" : "-" }}¥{{
                formatNumber(record.amount)
              }}
            </div>
          </div>
          <div v-if="recentRecords.length === 0" class="empty-state">
            <ListOrdered :size="48" :stroke-width="1" />
            <p>暂无记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useUserStore } from "../../stores/user";
import {
  Wallet,
  CreditCard,
  BarChart3,
  ListOrdered,
  TrendingUp,
  Calendar,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import * as echarts from "echarts";
import axios from "axios";
import CategoryIcon from "../../components/CategoryIcon.vue";

const userStore = useUserStore();

const timeRange = ref("month");
const trendChartRef = ref(null);
const categoryPieRef = ref(null);

// 热力图
const now = new Date();
const heatmapYear = ref(now.getFullYear());
const heatmapMonth = ref(now.getMonth() + 1);

const statistics = ref({ income: 0, expense: 0, balance: 0 });
const incomeChange = ref(0);
const expenseChange = ref(0);
const savingsRate = ref(0);
const recentRecords = ref([]);
const dailyExpenseData = ref([]);
const categoryType = ref("expense");
const categoryList = ref([]);
let categoryPieChart = null;
let trendChartInstance = null;

const budgetUsagePercent = computed(() => {
  const budget = userStore.budget.monthly || 0;
  if (budget === 0) return 0;
  return Math.min(Math.round((statistics.value.expense / budget) * 100), 100);
});

const heatmapCells = computed(() => {
  const year = heatmapYear.value;
  const month = heatmapMonth.value - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const maxDaily = Math.max(...dailyExpenseData.value.map((d) => d.amount), 1);

  const cells = [];
  const firstDay = new Date(year, month, 1).getDay();

  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: "", day: "", amount: 0, class: "empty" });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const daily = dailyExpenseData.value.find((d) => d.date === dateStr);
    const amount = daily?.amount || 0;

    let colorClass = "low";
    if (amount === 0) colorClass = "zero";
    else if (amount / maxDaily > 0.75) colorClass = "high";
    else if (amount / maxDaily > 0.5) colorClass = "medium-high";
    else if (amount / maxDaily > 0.25) colorClass = "medium";
    else colorClass = "low";

    cells.push({
      date: dateStr,
      day: day,
      amount: Math.round(amount * 100) / 100,
      class: colorClass,
    });
  }

  return cells;
});

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
  if (
    heatmapYear.value === now.getFullYear() &&
    heatmapMonth.value === now.getMonth() + 1
  )
    return;
  heatmapMonth.value++;
  if (heatmapMonth.value > 12) {
    heatmapMonth.value = 1;
    heatmapYear.value++;
  }
  fetchHeatmapData();
};

const fetchHeatmapData = async () => {
  try {
    const token = localStorage.getItem("token");
    const year = heatmapYear.value;
    const month = heatmapMonth.value;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

    const res = await axios.get("/api/transactions/daily-stats", {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${token}` },
    });
    dailyExpenseData.value = res.data || [];
  } catch (error) {
    console.error("获取热力图数据失败:", error);
  }
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

const fetchData = async () => {
  try {
    const token = localStorage.getItem("token");

    // 先获取用户设置（包含预算）
    try {
      const settingsRes = await axios.get("/api/user/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (settingsRes.data.settings?.budget) {
        userStore.updateBudget(settingsRes.data.settings.budget);
      }
    } catch (e) {
      console.error("获取设置失败:", e);
    }

    const res = await axios.get("/api/transactions/month-stats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const budget = userStore.budget.monthly || 5000;
    const expense = res.data.expense || 0;

    statistics.value = {
      income: res.data.income || 0,
      expense: expense,
      balance: (res.data.income || 0) - expense,
    };

    savingsRate.value =
      statistics.value.income > 0
        ? Math.round(
            ((statistics.value.income - expense) / statistics.value.income) *
              100,
          )
        : 0;

    incomeChange.value =
      res.data.incomeChange !== undefined ? res.data.incomeChange : 0;
    expenseChange.value =
      res.data.expenseChange !== undefined ? res.data.expenseChange : 0;

    // 最近交易
    const recordsRes = await axios.get("/api/transactions", {
      params: { pageSize: 10 },
      headers: { Authorization: `Bearer ${token}` },
    });
    recentRecords.value = recordsRes.data.transactions || [];

    // 分类统计
    const statsRes = await axios.get("/api/transactions/statistics", {
      params: { type: categoryType.value },
      headers: { Authorization: `Bearer ${token}` },
    });

    const expenseCats = statsRes.data.byCategory?.[categoryType.value] || [];
    const totalAmount = expenseCats.reduce((sum, cat) => sum + cat.total, 0);

    categoryList.value = expenseCats.slice(0, 6).map((cat) => ({
      name: cat.category,
      amount: cat.total,
      percent:
        totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100) : 0,
    }));

    // 热力图数据
    const dailyRes = await axios.get("/api/transactions/daily-stats", {
      params: { range: "month" },
      headers: { Authorization: `Bearer ${token}` },
    });
    dailyExpenseData.value = dailyRes.data || [];

    await nextTick();
    if (categoryPieRef.value) {
      renderCategoryPie();
    }
    if (trendChartRef.value) {
      renderChart();
    }
  } catch (error) {
    console.error("获取数据失败:", error);
  }
};

const renderCategoryPie = () => {
  if (!categoryPieRef.value) return;

  if (categoryPieChart) {
    categoryPieChart.dispose();
  }

  const chartData = categoryList.value.map((cat) => ({
    name: cat.name,
    value: cat.amount,
  }));

  const colors =
    categoryType.value === "expense"
      ? ["#FF3B30", "#FF6B6B", "#FF8E53", "#FFB347", "#FFD700", "#C0C0C0"]
      : ["#34C759", "#50C878", "#3CB371", "#2E8B57", "#20B2AA", "#C0C0C0"];

  categoryPieChart = echarts.init(categoryPieRef.value);
  categoryPieChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: ¥{c} ({d}%)",
      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: "#E7E5E4",
      textStyle: { color: "#1C1917", fontSize: 13 },
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      textStyle: { fontSize: 12, color: "#57534E" },
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "75%"],
        center: ["35%", "50%"],
        itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 3 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 15, fontWeight: "bold" } },
        data: chartData,
        color: colors,
      },
    ],
  });
};

const renderChart = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `/api/transactions/daily-stats?range=${timeRange.value}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = res.data || [];

    let days, chartData;
    if (timeRange.value === "week") {
      const now = new Date();
      const weekDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        weekDays.push(d.toISOString().split("T")[0]);
      }
      days = weekDays.map((d) => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      chartData = weekDays.map((d) => {
        const item = data.find((item) => item.date === d);
        return item ? item.amount : 0;
      });
    } else if (timeRange.value === "year") {
      const monthMap = {};
      data.forEach((item) => {
        const month = item.date.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + item.amount;
      });
      days = [
        "1月",
        "2月",
        "3月",
        "4月",
        "5月",
        "6月",
        "7月",
        "8月",
        "9月",
        "10月",
        "11月",
        "12月",
      ];
      const year = new Date().getFullYear();
      chartData = days.map(
        (_, i) => monthMap[`${year}-${String(i + 1).padStart(2, "0")}`] || 0,
      );
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDays = [];
      for (let i = 1; i <= daysInMonth; i++) {
        monthDays.push(
          `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        );
      }
      days = monthDays.map((d) => `${parseInt(d.split("-")[2])}日`);
      chartData = monthDays.map((d) => {
        const item = data.find((item) => item.date === d);
        return item ? item.amount : 0;
      });
    }

    if (trendChartInstance) {
      trendChartInstance.dispose();
    }
    trendChartInstance = echarts.init(trendChartRef.value);
    trendChartInstance.setOption({
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E7E5E4",
        textStyle: { color: "#1C1917", fontSize: 13 },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: 16,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { fontSize: 11, color: "#78716C" },
        axisLine: { lineStyle: { color: "#E7E5E4" } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 11,
          color: "#78716C",
          formatter: (val) =>
            val >= 1000 ? `¥${(val / 1000).toFixed(1)}k` : `¥${val}`,
        },
        splitLine: { lineStyle: { color: "#E7E5E4", type: "dashed" } },
      },
      series: [
        {
          type: "bar",
          data: chartData,
          barWidth: "55%",
          itemStyle: { color: "#4ECDC4", borderRadius: [6, 6, 0, 0] },
        },
      ],
    });
  } catch (error) {
    console.error("获取图表数据失败:", error);
  }
};

watch(categoryType, () => {
  fetchData();
});

onMounted(() => {
  userStore.fetchProfile();
  fetchData();
  fetchHeatmapData();
});
</script>

<style scoped>
.page-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.stat-card.expense {
  border-left: 3px solid var(--color-expense);
}
.stat-card.income {
  border-left: 3px solid var(--color-income);
}
.stat-card.balance {
  border-left: 3px solid var(--color-primary);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-hover);
  flex-shrink: 0;
}
.stat-card.expense .stat-icon {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}
.stat-card.income .stat-icon {
  background: var(--color-income-bg);
  color: var(--color-income);
}
.stat-card.balance .stat-icon {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.stat-info {
  flex: 1;
}
.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}
.stat-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}
.stat-trend {
  font-size: 12px;
  font-weight: 600;
}
.stat-trend.up {
  color: var(--color-expense);
}
.stat-trend.down {
  color: var(--color-income);
}
.stat-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.stat-badge.positive {
  background: var(--color-income-bg);
  color: var(--color-income);
}
.stat-badge.negative {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}
.stat-budget {
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.budget-progress {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}
.budget-fill {
  height: 100%;
  background: var(--color-expense);
  border-radius: 3px;
  transition: width 0.5s;
}
.budget-fill.savings {
  background: var(--color-income);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header.compact {
  padding: 12px 16px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.heatmap-card {
  padding: 0;
}
.heatmap-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.heatmap-section {
  padding: 16px;
  border-right: 1px solid var(--color-border);
}
.heatmap-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.heatmap-month {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 80px;
  text-align: center;
}
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  margin: 12px 0;
}
.heatmap-weekday {
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 4px 0;
  font-weight: 500;
}
.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-text-muted);
  cursor: default;
}
.heatmap-cell.zero {
  background: #ebedf0;
}
.heatmap-cell.low {
  background: #9be9a8;
}
.heatmap-cell.medium {
  background: #40c463;
}
.heatmap-cell.medium-high {
  background: #30a14e;
}
.heatmap-cell.high {
  background: #216e39;
  color: white;
}
.heatmap-cell.empty {
  background: transparent;
}
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.legend-bar {
  display: flex;
  gap: 2px;
}
.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}

.pie-section {
  padding: 16px;
}
.pie-area {
  height: 200px;
}

.btn-group {
  display: flex;
  gap: 4px;
}
.btn.small {
  padding: 5px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  background: var(--color-surface-hover);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn.small.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.btn.small.primary {
  background: var(--color-primary);
  color: white;
}
.icon-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.icon-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
}
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.chart-area {
  height: 280px;
}
.budget-detail {
  padding: 16px;
  display: flex;
  gap: 20px;
  align-items: center;
}
.budget-amounts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.budget-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.budget-label {
  color: var(--color-text-muted);
}
.budget-value {
  font-weight: 700;
}
.budget-value.expense {
  color: var(--color-expense);
}
.budget-value.income {
  color: var(--color-income);
}
.progress-ring-container {
  flex-shrink: 0;
}
.progress-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-primary) calc(var(--progress) * 1%),
    var(--color-border) 0
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-ring-inner {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.progress-percent {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.progress-label {
  font-size: 10px;
  color: var(--color-text-muted);
}

.transactions-list {
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
}
.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  transition: background var(--transition-fast);
}
.transaction-item:hover {
  background: var(--color-surface-hover);
}
.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.transaction-info {
  flex: 1;
}
.transaction-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.transaction-time {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.transaction-amount {
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}
.transaction-amount.expense {
  color: var(--color-expense);
}
.transaction-amount.income {
  color: var(--color-income);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
  .heatmap-content {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .page-container {
    padding: 16px;
  }
}
</style>
