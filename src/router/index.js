import { createRouter, createWebHistory } from 'vue-router';
import popup from '../views/popup.vue';

const router = createRouter({
  //history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: popup
    }
  ]
});

export default router;
