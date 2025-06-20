import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Import page components
const ChatApp = () => import('@/pages/ChatApp.vue');
const Login = () => import('@/pages/Login.vue');
const Register = () => import('@/pages/Register.vue');
const Profile = () => import('@/pages/Profile.vue');

const routes = [
    {
        path: '/',
        name: 'chat',
        component: ChatApp,
        meta: { requiresAuth: true },
    },
    {
        path: '/room/:roomId',
        name: 'chat-room',
        component: ChatApp,
        props: true,
        meta: { requiresAuth: true },
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { requiresGuest: true },
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        meta: { requiresGuest: true },
    },
    {
        path: '/profile',
        name: 'profile',
        component: Profile,
        meta: { requiresAuth: true },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    console.log('🛣️ Navigation guard triggered:');
    console.log('- From:', from.path);
    console.log('- To:', to.path);
    console.log('- Current token:', authStore.token ? 'exists' : 'null');
    console.log('- Current user:', authStore.user ? 'exists' : 'null');
    console.log('- isAuthenticated (before):', authStore.isAuthenticated);

    // Initialize auth store if token exists but user doesn't
    if (authStore.token && !authStore.user) {
        try {
            console.log('🔄 Initializing auth store...');
            await authStore.initialize();
            console.log('✅ Auth store initialized');
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            // Clear invalid token
            localStorage.removeItem('auth_token');
        }
    }

    const isAuthenticated = authStore.isAuthenticated;
    console.log('🔐 Final authentication status:', isAuthenticated);

    // Handle route access
    if (to.meta.requiresAuth && !isAuthenticated) {
        console.log('🚫 Access denied - auth required but not authenticated');
        console.log('🔄 Redirecting to login...');
        next({ name: 'login', query: { redirect: to.fullPath } });
    } else if (to.meta.requiresGuest && isAuthenticated) {
        console.log('👤 Already authenticated, redirecting to chat...');
        next({ name: 'chat' });
    } else {
        console.log('✅ Navigation allowed');
        next();
    }
});

export default router;
