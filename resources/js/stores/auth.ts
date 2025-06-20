import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginForm, RegisterForm, AuthState } from '@/types/chat';
import { authApi } from '@/utils/api';

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(null);
    const token = ref<string | null>(localStorage.getItem('auth_token'));
    const loading = ref(false);

    // Getters
    const isAuthenticated = computed(() => !!user.value && !!token.value);
    const currentUser = computed(() => user.value);

    // Actions
    const login = async (credentials: LoginForm) => {
        loading.value = true;
        try {
            console.log('📡 Making login API call...');
            const response = await authApi.login(credentials);

            console.log('✅ Login API response:', response);

            token.value = response.data.token;
            user.value = response.data.user;

            localStorage.setItem('auth_token', token.value);

            // Set axios default authorization header
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

            console.log('🔑 Token stored:', token.value);
            console.log('👤 User stored:', user.value);
            console.log('🧮 isAuthenticated computed:', isAuthenticated.value);

            return response;
        } catch (error) {
            console.error('❌ Login API error:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const register = async (userData: RegisterForm) => {
        loading.value = true;
        try {
            const response = await authApi.register(userData);
            token.value = response.data.token;
            user.value = response.data.user;

            localStorage.setItem('auth_token', token.value);
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

            return response;
        } catch (error) {
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const logout = async () => {
        // Prevent multiple logout calls
        if (loading.value) {
            console.log('🔄 Logout already in progress, skipping...');
            return;
        }

        // If already logged out, just clean up
        if (!token.value) {
            console.log('🔓 Already logged out, cleaning up client state...');
            user.value = null;
            localStorage.removeItem('auth_token');
            delete window.axios.defaults.headers.common['Authorization'];
            return;
        }

        loading.value = true;
        try {
            await authApi.logout();
            console.log('✅ Logout API call successful');
        } catch (error) {
            console.warn('⚠️ Logout API failed (continuing anyway):', error);
            // Continue with client-side logout even if API fails
        } finally {
            // Always clean up client state
            user.value = null;
            token.value = null;
            localStorage.removeItem('auth_token');
            delete window.axios.defaults.headers.common['Authorization'];
            loading.value = false;
            console.log('🧹 Client state cleaned up');
        }
    };

    const fetchUser = async () => {
        if (!token.value) return;

        loading.value = true;
        try {
            const response = await authApi.me();
            user.value = response.data;
        } catch (error) {
            // Token might be invalid, clear auth state
            await logout();
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const updateProfile = async (profileData: Partial<User>) => {
        loading.value = true;
        try {
            const response = await authApi.updateProfile(profileData);
            user.value = { ...user.value!, ...response.data };
            return response;
        } catch (error) {
            throw error;
        } finally {
            loading.value = false;
        }
    };

    // Initialize auth state
    const initialize = async () => {
        if (token.value) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
            try {
                await fetchUser();
            } catch (error) {
                console.error('Auth initialization failed:', error);
            }
        }
    };

    return {
        // State
        user,
        token,
        loading,

        // Getters
        isAuthenticated,
        currentUser,

        // Actions
        login,
        register,
        logout,
        fetchUser,
        updateProfile,
        initialize,
    };
});
