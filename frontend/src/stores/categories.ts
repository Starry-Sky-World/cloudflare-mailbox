import { defineStore } from 'pinia';
import { api } from '../api';

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as any[],
    loading: false,
  }),
  actions: {
    async fetchCategories() {
      this.loading = true;
      try {
        const data = await api.get('/categories');
        this.categories = data.categories || [];
      } finally {
        this.loading = false;
      }
    },
    async createCategory(payload: any) {
      await api.post('/categories', payload);
      await this.fetchCategories();
    },
    async updateCategory(id: string, payload: any) {
      await api.patch(`/categories/${id}`, payload);
      await this.fetchCategories();
    },
    async deleteCategory(id: string) {
      await api.delete(`/categories/${id}`);
      await this.fetchCategories();
    },
    async reorder(orders: any[]) {
      await api.put('/categories/reorder', { orders });
      await this.fetchCategories();
    },
  },
});
