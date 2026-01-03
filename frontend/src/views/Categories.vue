<template>
  <div>
    <div class="page-header">
      <h2>分类管理</h2>
      <n-button type="primary" @click="openCreate">新增分类</n-button>
    </div>

    <div v-if="store.loading" class="muted">加载中...</div>

    <div v-else class="category-list">
      <CategoryTree :categories="store.categories" @select="selectCategory" />
    </div>

    <n-modal v-model:show="showModal">
      <n-card title="分类" style="width: 420px">
        <n-form :model="form" label-placement="top">
          <n-form-item label="父级分类">
            <n-select v-model:value="form.parent_id" :options="parentOptions" clearable />
          </n-form-item>
          <n-form-item label="名称">
            <n-input v-model:value="form.name" />
          </n-form-item>
          <n-form-item label="图标">
            <n-input v-model:value="form.icon" />
          </n-form-item>
          <n-form-item label="颜色">
            <n-input v-model:value="form.color" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button v-if="editingId" type="error" secondary @click="openDelete">删除</n-button>
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" @click="save">保存</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>

    <n-modal v-model:show="showDelete">
      <n-card title="确认删除" style="width: 360px">
        <p>删除分类后，该分类下邮件将转移到默认分类。</p>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showDelete = false">取消</n-button>
            <n-button type="error" @click="confirmDelete">删除</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { NButton, NCard, NForm, NFormItem, NInput, NModal, NSpace, NSelect } from 'naive-ui';
import CategoryTree from '../components/category/CategoryTree.vue';
import { useCategoriesStore } from '../stores/categories';

const store = useCategoriesStore();
const showModal = ref(false);
const showDelete = ref(false);
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

const form = reactive({
  name: '',
  icon: '📁',
  color: '#666666',
  parent_id: '' as string | null,
});

const openCreate = () => {
  editingId.value = null;
  form.name = '';
  form.icon = '📁';
  form.color = '#666666';
  form.parent_id = '';
  showModal.value = true;
};

const selectCategory = (id: string) => {
  if (id === 'default') return;
  editingId.value = id;
  const selected = findCategory(store.categories, id);
  if (selected) {
    form.name = selected.name;
    form.icon = selected.icon;
    form.color = selected.color;
    form.parent_id = selected.parent_id;
  }
  showModal.value = true;
};

const save = async () => {
  if (!form.name) return;
  const payload = {
    name: form.name,
    icon: form.icon,
    color: form.color,
    parent_id: form.parent_id || null,
  };
  if (editingId.value) {
    await store.updateCategory(editingId.value, payload);
  } else {
    await store.createCategory(payload);
  }
  showModal.value = false;
};

const confirmDelete = async () => {
  if (!pendingDeleteId.value) return;
  await store.deleteCategory(pendingDeleteId.value);
  showDelete.value = false;
};

const openDelete = () => {
  pendingDeleteId.value = editingId.value;
  showModal.value = false;
  showDelete.value = true;
};

onMounted(() => {
  store.fetchCategories();
});

const findCategory = (items: any[], id: string): any | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findCategory(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

const flattenCategories = (items: any[], out: any[] = []) => {
  for (const item of items) {
    out.push(item);
    if (item.children?.length) flattenCategories(item.children, out);
  }
  return out;
};

const parentOptions = computed(() => {
  const flat = flattenCategories(store.categories);
  return flat
    .filter((item) => item.id !== editingId.value)
    .map((item) => ({ label: `${item.name} (${item.id})`, value: item.id }));
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-list {
  margin-top: 16px;
}
</style>
