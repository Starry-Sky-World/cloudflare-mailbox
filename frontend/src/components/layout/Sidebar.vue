<template>
  <div>
    <div class="section-title">分类</div>
    <div v-if="loading" class="muted">加载中...</div>
    <div v-else>
      <CategoryTree
        v-if="categories.length"
        :categories="categories"
        :active-id="activeCategory"
        @select="selectCategory"
      />
    </div>

    <div class="section-title">管理</div>
    <div class="link-row" @click="go('/pipeline')">⚙️ 管道配置</div>
    <div class="link-row" @click="go('/categories')">📂 分类管理</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryTree from '../category/CategoryTree.vue';
import { useCategoriesStore } from '../../stores/categories';

const router = useRouter();
const route = useRoute();
const store = useCategoriesStore();

const categories = computed(() => store.categories);
const loading = computed(() => store.loading);
const activeCategory = computed(() => route.params.categoryId as string | undefined);

const selectCategory = (id: string) => {
  router.push(`/inbox/${id}`);
};

const go = (path: string) => router.push(path);

onMounted(() => {
  store.fetchCategories();
});
</script>

<style scoped>
.section-title {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin: 12px 0 8px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

</style>
