import { createRouter, createWebHistory, RouteRecordRaw, RouterScrollBehavior } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:entry?',
    alias: '/',
    name: 'Home',
    // component: Home,
    component: () => import('./components/Home.vue'),
  },
  {
    path: '/app/history',
    name: 'History',
    // component: Home,
    component: () => import('./components/History.vue'),
  },
  ];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
