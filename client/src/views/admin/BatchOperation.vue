<template>
  <div class="placeholder-page bg-white rounded-2xl p-12 text-center shadow-sm">
    <el-empty :description="title + ' - 开发中'" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title || '页面')
</script>

<style scoped>
.placeholder-page {
  
}
</style>
