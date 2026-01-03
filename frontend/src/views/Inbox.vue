<template>
  <div class="inbox">
    <div class="inbox-header">
      <n-input v-model:value="search" placeholder="搜索邮件" @keyup.enter="refresh" />
      <n-button @click="refresh">刷新</n-button>
    </div>

    <div class="inbox-body">
      <div class="list-panel">
        <EmailList :emails="store.emails" @select="selectEmail" />
        <div class="pagination">
          <n-button size="small" :disabled="page <= 1" @click="page--">上一页</n-button>
          <span class="muted">第 {{ page }} / {{ store.pagination.total_pages }} 页</span>
          <n-button size="small" :disabled="page >= store.pagination.total_pages" @click="page++">下一页</n-button>
        </div>
      </div>
      <div class="detail-panel">
        <n-button class="mobile-back" size="small" @click="clearSelection" v-if="store.activeEmail">
          返回列表
        </n-button>
        <EmailDetail
          :email="store.activeEmail"
          @toggle-read="toggleRead"
          @toggle-star="toggleStar"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NInput } from 'naive-ui';
import EmailList from '../components/email/EmailList.vue';
import EmailDetail from '../components/email/EmailDetail.vue';
import { useEmailsStore } from '../stores/emails';

const store = useEmailsStore();
const route = useRoute();
const search = ref('');
const page = ref(1);

const categoryId = computed(() => route.params.categoryId as string | undefined);

const refresh = async () => {
  await store.fetchEmails({
    category_id: categoryId.value,
    search: search.value || undefined,
    page: page.value,
  });
};

const selectEmail = async (id: string) => {
  await store.fetchEmail(id);
  if (store.activeEmail && !store.activeEmail.is_read) {
    await store.updateEmail(id, { is_read: true });
  }
};

const toggleRead = async () => {
  if (!store.activeEmail) return;
  await store.updateEmail(store.activeEmail.id, { is_read: !store.activeEmail.is_read });
};

const toggleStar = async () => {
  if (!store.activeEmail) return;
  await store.updateEmail(store.activeEmail.id, { is_starred: !store.activeEmail.is_starred });
};

const clearSelection = () => {
  store.activeEmail = null;
};

watch([categoryId, page], () => {
  refresh();
});

onMounted(() => {
  refresh();
});
</script>

<style scoped>
.inbox-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.inbox-body {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 2fr;
  gap: 20px;
}

.list-panel {
  display: grid;
  gap: 12px;
}

.detail-panel {
  min-height: 320px;
}

.mobile-back {
  display: none;
  margin-bottom: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 960px) {
  .inbox-body {
    grid-template-columns: 1fr;
  }

  .mobile-back {
    display: inline-flex;
  }

  .inbox-header {
    gap: 8px;
    margin-bottom: 12px;
  }
}

@media (max-width: 600px) {
  .inbox-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
