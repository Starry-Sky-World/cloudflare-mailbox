<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>欢迎回来</h1>
      <p class="muted">请输入密码进入收件箱。</p>
      <n-input v-model:value="password" type="password" placeholder="密码" />
      <n-button type="primary" :loading="loading" @click="submit">登录</n-button>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NInput } from 'naive-ui';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const password = ref('');
const loading = ref(false);
const error = ref('');

const submit = async () => {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.message || '登录失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: min(420px, 100%);
  background: #ffffffcc;
  padding: 28px;
  border-radius: 18px;
  display: grid;
  gap: 16px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15);
}

.error {
  color: #e11d48;
}
</style>
