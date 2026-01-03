<template>
  <n-config-provider>
    <div class="app-shell">
      <RouterView />
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider } from 'naive-ui';
</script>
