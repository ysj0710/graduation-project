<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <UserPlus :size="18" :stroke-width="1.5" />
          <span>新增用户</span>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="form.username" type="text" placeholder="请输入用户名" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="form.password" type="password" placeholder="请输入密码（至少6位）" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="form.email" type="email" placeholder="请输入邮箱" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">用户角色</label>
            <select v-model="form.role" class="form-input">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">月度预算</label>
            <div class="input-with-unit">
              <input v-model.number="form.budget" type="number" step="500" min="0" class="form-input" />
              <span class="unit">元</span>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <Save :size="16" :stroke-width="2" />
              {{ loading ? '保存中...' : '保存' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="$router.back()">
              <X :size="16" :stroke-width="2" />
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserPlus, Save, X } from 'lucide-vue-next'
import axios from 'axios'

const router = useRouter()
const form = ref({
  username: '',
  password: '',
  email: '',
  role: 'user',
  budget: 5000
})
const loading = ref(false)

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password || !form.value.email) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (form.value.password.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/users', {
      username: form.value.username,
      password: form.value.password,
      email: form.value.email,
      role: form.value.role,
      budget: form.value.budget
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('用户创建成功')
    router.push('/admin/users')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '创建用户失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

/* Card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-width: 600px;
}
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.card-body { padding: 24px; }

/* Form */
.form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: all var(--transition-fast);
  outline: none;
}
.form-input::placeholder { color: var(--color-text-muted); }
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }

.input-with-unit { display: flex; align-items: center; gap: 8px; }
.input-with-unit .form-input { flex: 1; }
.unit {
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.form-actions { display: flex; gap: 12px; margin-top: 8px; }
.btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary { border: none; background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-secondary { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); }
.btn-secondary:hover { background: var(--color-surface-hover); color: var(--color-text-primary); }
</style>