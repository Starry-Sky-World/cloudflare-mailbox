import { defineStore } from 'pinia';
import { api } from '../api';

export const useEmailsStore = defineStore('emails', {
  state: () => ({
    emails: [] as any[],
    pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
    loading: false,
    activeEmail: null as any | null,
  }),
  actions: {
    async fetchEmails(params: Record<string, any>) {
      this.loading = true;
      try {
        const query = new URLSearchParams(params).toString();
        const data = await api.get(`/emails?${query}`);
        this.emails = data.emails || [];
        this.pagination = data.pagination;
      } finally {
        this.loading = false;
      }
    },
    async fetchEmail(id: string) {
      this.activeEmail = await api.get(`/emails/${id}`);
    },
    async updateEmail(id: string, payload: any) {
      await api.patch(`/emails/${id}`, payload);
      if (this.activeEmail?.id === id) {
        this.activeEmail = { ...this.activeEmail, ...payload };
      }
    },
    async deleteEmail(id: string) {
      await api.delete(`/emails/${id}`);
      this.emails = this.emails.filter((email) => email.id !== id);
    },
  },
});
