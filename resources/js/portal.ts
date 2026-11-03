import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import '../css/portal.css';
import PortalApp from './PortalApp.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            alias: '/dashboard',
            component: () => import('./pages/portal/Dashboard.vue'),
        },
        {
            path: '/admin',
            component: () => import('./pages/portal/Administration.vue'),
        },
        {
            path: '/organisations/:id(\\d+)',
            component: () => import('./pages/portal/Organisation.vue'),
        },
        {
            path: '/:pathMatch(.*)*',
            component: () => import('./pages/portal/NotFound.vue'),
        },
    ],
    scrollBehavior: () => ({ top: 0 }),
});
router.afterEach(() => {
    document.title = 'BULSCA Member Portal';
});
createApp(PortalApp).use(router).mount('#app');
