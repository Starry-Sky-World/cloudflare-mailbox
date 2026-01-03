<template>
  <div class="category-tree">
    <div v-for="category in categories" :key="category.id" class="category-node">
      <div
        class="category-row"
        :class="{ active: activeId === category.id }"
        :style="{ paddingLeft: `${depth * 14}px` }"
        @click="$emit('select', category.id)"
      >
        <span>{{ category.icon }}</span>
        <span>{{ category.name }}</span>
        <span v-if="category.unread_count" class="pill">{{ category.unread_count }}</span>
      </div>
      <CategoryTree
        v-if="category.children && category.children.length"
        :categories="category.children"
        :active-id="activeId"
        :depth="depth + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue';

withDefaults(defineProps<{ categories: any[]; activeId?: string; depth?: number }>(), {
  depth: 0,
});
defineEmits(['select']);
</script>

<style scoped>
.category-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.category-row.active {
  background: #111827;
  color: #f9fafb;
}

.pill {
  margin-left: auto;
  background: #ff7a59;
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}
</style>
