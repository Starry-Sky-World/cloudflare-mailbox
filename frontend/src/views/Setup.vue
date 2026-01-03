<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>📬 初始化邮箱</h1>
      <n-steps :current="step" size="small">
        <n-step title="设置密码" />
        <n-step title="AI 配置" />
        <n-step title="完成" />
      </n-steps>

      <div v-if="step === 1" class="step">
        <n-input v-model:value="password" type="password" placeholder="设置密码" />
        <n-input v-model:value="confirm" type="password" placeholder="确认密码" />
        <n-alert type="warning" title="请妥善保存密码" />
      </div>

      <div v-if="step === 2" class="step">
        <n-input v-model:value="ai.endpoint" placeholder="API 地址" />
        <n-input v-model:value="ai.api_key" type="password" placeholder="API Key" />
        <n-input v-model:value="ai.model" placeholder="模型名称" />
        <n-checkbox v-model:checked="skipAI">暂不配置 AI</n-checkbox>
        <div v-if="testResult" :class="testResult.success ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
        <n-button size="small" @click="testAI" :disabled="skipAI || !ai.endpoint || !ai.api_key || !ai.model">
          测试连接
        </n-button>
      </div>

      <div v-if="step === 3" class="step">
        <n-result status="success" title="设置完成" />
        <p class="muted">接下来请在 Cloudflare 控制台配置 Email Routing。</p>
      </div>

      <div class="footer">
        <n-button v-if="step > 1" @click="step--">上一步</n-button>
        <n-button v-if="step < 3" type="primary" :loading="loading" @click="next">
          {{ step === 2 ? '完成设置' : '下一步' }}
        </n-button>
        <n-button v-if="step === 3" type="primary" @click="goApp">进入收件箱</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NAlert, NButton, NCheckbox, NInput, NResult, NSteps, NStep } from 'naive-ui';
import { useAuthStore } from '../stores/auth';
import { api } from '../api';

const router = useRouter();
const auth = useAuthStore();

const step = ref(1);
const password = ref('');
const confirm = ref('');
const skipAI = ref(false);
const loading = ref(false);
const ai = ref({ endpoint: '', api_key: '', model: '' });
const testResult = ref<{ success: boolean; message: string } | null>(null);

const testAI = async () => {
  testResult.value = null;
  try {
    const res = await api.post('/settings/ai/test', ai.value);
    testResult.value = { success: res.success, message: res.message };
  } catch (err: any) {
    testResult.value = { success: false, message: err.message };
  }
};

const next = async () => {
  if (step.value === 1) {
    if (!password.value || password.value !== confirm.value) return;
    step.value = 2;
    return;
  }

  if (step.value === 2) {
    loading.value = true;
    try {
      await auth.setup(password.value, skipAI.value ? undefined : ai.value);
      step.value = 3;
    } finally {
      loading.value = false;
    }
  }
};

const goApp = () => router.push('/');
</script>

<style scoped>
.step {
  display: grid;
  gap: 12px;
}

.footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.success {
  color: #16a34a;
}

.error {
  color: #dc2626;
}
</style>
