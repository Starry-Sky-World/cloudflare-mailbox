<template>
  <n-card :title="title" style="width: 520px; max-width: 95vw;">
    <n-form :model="local" label-placement="top">
      <n-form-item label="规则名称">
        <n-input v-model:value="local.name" />
      </n-form-item>

      <template v-if="local.type === 'recipient'">
        <n-form-item label="收件人规则 (通配符)">
          <div class="rule-list">
            <div v-for="(rule, index) in local.config.rules" :key="index" class="rule-row">
              <n-input v-model:value="rule.pattern" placeholder="*@domain.com" />
              <n-input v-model:value="rule.category_id" placeholder="分类 ID (留空继续)" />
              <n-button text type="error" @click="removeRule(index)">移除</n-button>
            </div>
            <n-button size="small" @click="addRule">添加规则</n-button>
          </div>
        </n-form-item>
        <n-form-item label="未命中时">
          <n-select v-model:value="local.config.fallback" :options="fallbackOptions" />
        </n-form-item>
      </template>

      <template v-else-if="local.type === 'regex'">
        <n-form-item label="匹配字段">
          <n-select v-model:value="local.config.field" :options="fieldOptions" />
        </n-form-item>
        <n-form-item label="正则表达式">
          <n-input v-model:value="local.config.pattern" placeholder="验证码|verify" />
        </n-form-item>
        <n-form-item label="Flags">
          <n-input v-model:value="local.config.flags" placeholder="i" />
        </n-form-item>
        <n-form-item label="分类 ID">
          <n-input v-model:value="local.config.category_id" placeholder="category-id" />
        </n-form-item>
      </template>

      <template v-else-if="local.type === 'keyword'">
        <n-form-item label="匹配字段">
          <n-select v-model:value="local.config.field" :options="fieldOptions" />
        </n-form-item>
        <n-form-item label="模式">
          <n-select v-model:value="local.config.mode" :options="modeOptions" />
        </n-form-item>
        <n-form-item label="关键词 (逗号分隔)">
          <n-input v-model:value="keywords" placeholder="订单, 发货, 退款" />
        </n-form-item>
        <n-form-item label="分类 ID">
          <n-input v-model:value="local.config.category_id" placeholder="category-id" />
        </n-form-item>
      </template>

      <template v-else-if="local.type === 'ai'">
        <n-form-item label="候选分类 ID (逗号分隔)">
          <n-input v-model:value="candidates" placeholder="id1, id2" />
        </n-form-item>
        <n-form-item label="自定义提示词">
          <n-input v-model:value="local.config.custom_prompt" type="textarea" :rows="4" />
        </n-form-item>
      </template>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="primary" @click="save">保存</n-button>
      </n-space>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
} from 'naive-ui';

const props = defineProps<{ node: any }>();
const emit = defineEmits(['save', 'cancel']);

const local = ref(JSON.parse(JSON.stringify(props.node || {})));
const keywords = ref('');
const candidates = ref('');

watch(
  () => props.node,
  (value) => {
    local.value = JSON.parse(JSON.stringify(value || {}));
    keywords.value = local.value?.config?.keywords?.join(', ') || '';
    candidates.value = local.value?.config?.candidate_categories?.join(', ') || '';
  },
  { immediate: true }
);

const title = computed(() => {
  const map: Record<string, string> = {
    recipient: '收件人路由',
    regex: '正则匹配',
    keyword: '关键词匹配',
    ai: 'AI 分类',
  };
  return map[local.value.type] || '节点';
});

const fieldOptions = [
  { label: '标题', value: 'subject' },
  { label: '发件人', value: 'from' },
  { label: '收件人', value: 'to' },
  { label: '正文', value: 'body' },
];
const modeOptions = [
  { label: '包含任意', value: 'any' },
  { label: '包含全部', value: 'all' },
];
const fallbackOptions = [
  { label: '继续', value: 'continue' },
  { label: '默认分类', value: 'default' },
];

const addRule = () => {
  local.value.config.rules.push({ pattern: '', category_id: null });
};

const removeRule = (index: number) => {
  local.value.config.rules.splice(index, 1);
};

const save = () => {
  if (local.value.type === 'keyword') {
    local.value.config.keywords = keywords.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (local.value.type === 'ai') {
    local.value.config.candidate_categories = candidates.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  emit('save', local.value);
};
</script>

<style scoped>
.rule-list {
  display: grid;
  gap: 8px;
}

.rule-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
}
</style>
