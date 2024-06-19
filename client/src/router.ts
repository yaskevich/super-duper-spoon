import { createRouter, createWebHistory, RouteRecordRaw, RouterScrollBehavior } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    // component: Home,
    component: () => import('./components/Home.vue'),
  },
  ];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
