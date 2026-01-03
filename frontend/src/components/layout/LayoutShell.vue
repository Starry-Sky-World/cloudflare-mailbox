<template>
  <div>
    <div class="top-bar">
      <div class="brand">
        <n-button class="mobile-toggle" text @click="showSidebar = true">☰</n-button>
        <span>📬 Cloudflare Mailbox</span>
      </div>
      <div>
        <n-button text @click="goSettings">设置</n-button>
        <n-button text @click="logout">退出</n-button>
      </div>
    </div>
    <div class="main-layout">
      <Sidebar class="sidebar" />
      <div class="content-card">
        <RouterView />
      </div>
    </div>
    <div v-if="showSidebar" class="mobile-overlay" @click="showSidebar = false"></div>
    <div class="mobile-drawer" :class="{ open: showSidebar }">
      <Sidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton } from 'naive-ui';
import Sidebar from './Sidebar.vue';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const showSidebar = ref(false);

const goSettings = () => router.push('/settings');
const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>
