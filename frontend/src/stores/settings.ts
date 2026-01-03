import { defineStore } from 'pinia';
import { api } from '../api';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    ai: {
      enabled: false,
      endpoint: '',
      model: '',
      has_api_key: false,
    },
  }),
  actions: {
    async fetchSettings() {
      const data = await api.get('/settings');
      this.ai = data.ai;
    },
    async updatePassword(current_password: string, new_password: string) {
      await api.put('/settings/password', { current_password, new_password });
    },
    async updateAI(payload: any) {
      await api.put('/settings/ai', payload);
      await this.fetchSettings();
    },
    async testAI(payload: any) {
      return await api.post('/settings/ai/test', payload);
    },
  },
});
