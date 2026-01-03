import { defineStore } from 'pinia';
import { api } from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('mailbox_token') || '',
    initialized: false,
    initializedLoaded: false,
  }),
  actions: {
    async fetchStatus() {
      const data = await api.get('/status');
      this.initialized = Boolean(data.initialized);
      this.initializedLoaded = true;
    },
    async login(password: string) {
      const data = await api.post('/login', { password });
      this.token = data.token;
      localStorage.setItem('mailbox_token', data.token);
    },
    async setup(password: string, ai?: { endpoint: string; api_key: string; model: string }) {
      const payload = { password, ai };
      const data = await api.post('/setup', payload);
      this.token = data.token;
      this.initialized = true;
      localStorage.setItem('mailbox_token', data.token);
    },
    logout() {
      this.token = '';
      localStorage.removeItem('mailbox_token');
    },
  },
});
