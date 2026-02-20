<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>📈 分类消费分析</h3>
      <div ref="pieChartRef" class="chart-container"></div>
    </div>
    
    <div class="ios-card">
      <h3>📊 分类对比</h3>
      <div ref="barChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const pieChartRef = ref(null)
const barChartRef = ref(null)

const renderCharts = () => {
  // 饼图
  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { name: '餐饮', value: 3200, itemStyle: { color: '#FF3B30' } },
          { name: '购物', value: 4100, itemStyle: { color: '#007AFF' } },
          { name: '交通', value: 1800, itemStyle: { color: '#FF9500' } },
          { name: '娱乐', value: 2200, itemStyle: { color: '#AF52DE' } }
        ]
      }]
    })
  }
  
  // 柱状图
  if (barChartRef.value) {
    const chart = echarts.init(barChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['餐饮', '购物', '交通', '娱乐', '住房'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [3200, 4100, 1800, 2200, 3500],
        itemStyle: { borderRadius: [8, 8, 0, 0] }
      }]
    })
  }
}

onMounted(() => {
  nextTick(renderCharts)
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.ios-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.chart-container {
  height: 300px;
}
</style>
