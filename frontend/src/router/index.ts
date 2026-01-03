import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Setup from '../views/Setup.vue';
import Inbox from '../views/Inbox.vue';
import Categories from '../views/Categories.vue';
import Pipeline from '../views/Pipeline.vue';
import Settings from '../views/Settings.vue';
import Layout from '../components/layout/LayoutShell.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/setup', component: Setup, meta: { guest: true } },
  {
    path: '/',
    component: Layout,
    meta: { auth: true },
    children: [
      { path: '', redirect: '/inbox' },
      { path: 'inbox', component: Inbox, name: 'inbox' },
      { path: 'inbox/:categoryId', component: Inbox, name: 'inbox-category' },
      { path: 'categories', component: Categories, name: 'categories' },
      { path: 'pipeline', component: Pipeline, name: 'pipeline' },
      { path: 'settings', component: Settings, name: 'settings' },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.initializedLoaded) {
    await auth.fetchStatus();
  }

  if (to.meta?.guest && auth.initialized && auth.token) {
    return '/';
  }

  if (to.meta?.auth && (!auth.initialized || !auth.token)) {
    return auth.initialized ? '/login' : '/setup';
  }

  if (to.path === '/login' && !auth.initialized) {
    return '/setup';
  }

  return true;
});

export default router;
