<template>
  <div class="email-list">
    <div
      v-for="email in emails"
      :key="email.id"
      class="email-item"
      :class="{ unread: !email.is_read }"
      @click="$emit('select', email.id)"
    >
      <div>
        <div>{{ email.from_name || email.from_address }}</div>
        <div class="muted">{{ email.subject || '(无主题)' }}</div>
        <div class="muted">{{ email.preview }}</div>
      </div>
      <div class="muted">{{ formatDate(email.received_at) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ emails: any[] }>();
defineEmits(['select']);

const formatDate = (value: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};
</script>

<style scoped>
@media (max-width: 960px) {
  .email-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
