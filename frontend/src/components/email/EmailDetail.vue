<template>
  <div v-if="email" class="detail">
    <div class="detail-header">
      <div>
        <h2>{{ email.subject || '(无主题)' }}</h2>
        <div class="muted">来自：{{ email.from_name || email.from_address }}</div>
        <div class="muted">收件：{{ email.to_address }}</div>
      </div>
      <div class="detail-actions">
        <n-button size="small" @click="$emit('toggle-read')">
          {{ email.is_read ? '标为未读' : '标为已读' }}
        </n-button>
        <n-button size="small" @click="$emit('toggle-star')">
          {{ email.is_starred ? '取消星标' : '星标' }}
        </n-button>
      </div>
    </div>
    <div class="detail-body">
      <pre>{{ email.body_text || '' }}</pre>
    </div>
  </div>
  <div v-else class="muted">请选择一封邮件</div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui';

defineProps<{ email: any | null }>();
defineEmits(['toggle-read', 'toggle-star']);
</script>

<style scoped>
.detail {
  display: grid;
  gap: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-body {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  max-height: 60vh;
  overflow: auto;
}

pre {
  white-space: pre-wrap;
  margin: 0;
  font-family: inherit;
}
</style>
