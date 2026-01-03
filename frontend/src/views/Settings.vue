<template>
  <div>
    <h2>系统设置</h2>

    <n-card title="修改密码" style="margin-top: 16px;">
      <n-form :model="passwordForm" label-placement="top">
        <n-form-item label="当前密码">
          <n-input v-model:value="passwordForm.current" type="password" />
        </n-form-item>
        <n-form-item label="新密码">
          <n-input v-model:value="passwordForm.next" type="password" />
        </n-form-item>
      </n-form>
      <n-button type="primary" @click="updatePassword">更新密码</n-button>
    </n-card>

    <n-card title="AI 配置" style="margin-top: 16px;">
      <n-form :model="aiForm" label-placement="top">
        <n-form-item label="启用 AI">
          <n-switch v-model:value="aiForm.enabled" />
        </n-form-item>
        <n-form-item label="API 地址">
          <n-input v-model:value="aiForm.endpoint" placeholder="https://api.openai.com/v1/chat/completions" />
        </n-form-item>
        <n-form-item label="API Key">
          <n-input v-model:value="aiForm.api_key" type="password" placeholder="sk-..." />
        </n-form-item>
        <n-form-item label="模型">
          <n-input v-model:value="aiForm.model" placeholder="gpt-4o-mini" />
        </n-form-item>
      </n-form>
      <n-space>
        <n-button type="primary" @click="saveAI">保存配置</n-button>
        <n-button @click="testAI">测试连接</n-button>
      </n-space>
      <div v-if="aiMessage" :class="aiMessage.success ? 'success' : 'error'">
        {{ aiMessage.message }}
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NSwitch,
} from 'naive-ui';
import { useSettingsStore } from '../stores/settings';

const store = useSettingsStore();

const passwordForm = reactive({ current: '', next: '' });
const aiForm = reactive({ enabled: false, endpoint: '', api_key: '', model: '' });
const aiMessage = ref<{ success: boolean; message: string } | null>(null);

const updatePassword = async () => {
  await store.updatePassword(passwordForm.current, passwordForm.next);
  passwordForm.current = '';
  passwordForm.next = '';
};

const saveAI = async () => {
  await store.updateAI(aiForm);
};

const testAI = async () => {
  aiMessage.value = null;
  try {
    const res = await store.testAI(aiForm);
    aiMessage.value = { success: res.success, message: res.message };
  } catch (err: any) {
    aiMessage.value = { success: false, message: err.message };
  }
};

onMounted(async () => {
  await store.fetchSettings();
  aiForm.enabled = store.ai.enabled;
  aiForm.endpoint = store.ai.endpoint;
  aiForm.model = store.ai.model;
});
</script>

<style scoped>
.success {
  color: #16a34a;
  margin-top: 8px;
}

.error {
  color: #dc2626;
  margin-top: 8px;
}
</style>
