import { defineStore } from 'pinia';
import { api } from '../api';

export const usePipelineStore = defineStore('pipeline', {
  state: () => ({
    nodes: [] as any[],
    loading: false,
    updated_at: '',
  }),
  actions: {
    async fetchPipeline() {
      this.loading = true;
      try {
        const data = await api.get('/pipeline');
        this.nodes = data.nodes || [];
        this.updated_at = data.updated_at;
      } finally {
        this.loading = false;
      }
    },
    async savePipeline(nodes: any[]) {
      await api.put('/pipeline', { nodes });
      await this.fetchPipeline();
    },
    async testPipeline(payload: any) {
      return await api.post('/pipeline/test', payload);
    },
  },
});
