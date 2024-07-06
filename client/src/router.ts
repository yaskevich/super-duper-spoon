import { createRouter, createWebHistory, RouteRecordRaw, RouterScrollBehavior } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    // component: Home,
    component: () => import('./components/Home.vue'),
  },
  {
    path: '/',
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
