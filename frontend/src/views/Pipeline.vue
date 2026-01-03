<template>
  <div>
    <div class="page-header">
      <h2>分类管道</h2>
      <n-button type="primary" @click="save">保存管道</n-button>
    </div>

    <div class="pipeline">
      <div class="pipeline-node">📨 邮件入口</div>
      <VueDraggable v-model="editableNodes" item-key="id" handle=".drag">
        <template #item="{ element }">
          <div class="pipeline-node" :class="{ disabled: !element.enabled }">
            <div class="node-left">
              <span class="drag">≡</span>
              <span>{{ iconFor(element.type) }}</span>
              <span>{{ element.name }}</span>
            </div>
            <div class="node-actions">
              <n-switch v-model:value="element.enabled" size="small" />
              <n-button text @click="edit(element)">编辑</n-button>
              <n-button text type="error" @click="remove(element)">删除</n-button>
            </div>
          </div>
        </template>
      </VueDraggable>
      <div class="pipeline-node">📥 默认分类</div>
    </div>

    <n-button class="add-btn" @click="showAdd = true">添加规则</n-button>

    <n-modal v-model:show="showAdd">
      <n-card title="选择规则类型" style="width: 360px">
        <n-space vertical>
          <n-button @click="add('recipient')">📮 收件人路由</n-button>
          <n-button @click="add('regex')">🔤 正则匹配</n-button>
          <n-button @click="add('keyword')">🏷️ 关键词匹配</n-button>
          <n-button @click="add('ai')">🤖 AI 分类</n-button>
        </n-space>
      </n-card>
    </n-modal>

    <n-modal v-model:show="showEditor">
      <NodeEditor :node="editing" @save="applyEdit" @cancel="showEditor = false" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NModal, NSpace, NSwitch } from 'naive-ui';
import { VueDraggable } from 'vue-draggable-plus';
import NodeEditor from '../components/pipeline/NodeEditor.vue';
import { usePipelineStore } from '../stores/pipeline';

const store = usePipelineStore();
const showAdd = ref(false);
const showEditor = ref(false);
const editing = ref<any | null>(null);

const editableNodes = computed({
  get: () => store.nodes.filter((node) => node.type !== 'entry' && node.type !== 'default'),
  set: (value) => {
    store.nodes = [
      store.nodes.find((node) => node.type === 'entry'),
      ...value,
      store.nodes.find((node) => node.type === 'default'),
    ].filter(Boolean);
  },
});

const iconFor = (type: string) => {
  const map: Record<string, string> = {
    recipient: '📮',
    regex: '🔤',
    keyword: '🏷️',
    ai: '🤖',
  };
  return map[type] || '⚙️';
};

const add = (type: string) => {
  const base = {
    id: crypto.randomUUID(),
    type,
    name: '新规则',
    enabled: true,
  };

  let node: any = base;
  if (type === 'recipient') {
    node = { ...base, config: { rules: [{ pattern: '*', category_id: null }], fallback: 'continue' } };
  }
  if (type === 'regex') {
    node = { ...base, config: { field: 'subject', pattern: '', flags: 'i', category_id: 'default' } };
  }
  if (type === 'keyword') {
    node = { ...base, config: { field: 'subject', mode: 'any', keywords: [], category_id: 'default' } };
  }
  if (type === 'ai') {
    node = { ...base, config: { candidate_categories: ['default'], custom_prompt: '' } };
  }

  store.nodes.splice(store.nodes.length - 1, 0, node);
  showAdd.value = false;
  editing.value = node;
  showEditor.value = true;
};

const edit = (node: any) => {
  editing.value = node;
  showEditor.value = true;
};

const applyEdit = (node: any) => {
  const index = store.nodes.findIndex((item) => item.id === node.id);
  if (index >= 0) store.nodes[index] = node;
  showEditor.value = false;
};

const remove = (node: any) => {
  store.nodes = store.nodes.filter((item) => item.id !== node.id);
};

const save = async () => {
  await store.savePipeline(store.nodes);
};

onMounted(async () => {
  await store.fetchPipeline();
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pipeline {
  display: grid;
  gap: 10px;
}

.pipeline-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e4e4e7;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag {
  cursor: grab;
}

.add-btn {
  margin-top: 12px;
}

.disabled {
  opacity: 0.6;
}
</style>
