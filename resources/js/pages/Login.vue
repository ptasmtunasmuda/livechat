<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to Live Chat</h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    Or
                    <router-link to="/register" class="font-medium text-indigo-600 hover:text-indigo-500"> create a new account </router-link>
                </p>
            </div>

            <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="email" class="sr-only">Email address</label>
                        <input
                            id="email"
                            v-model="form.email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Email address"
                        />
                    </div>
                    <div>
                        <label for="password" class="sr-only">Password</label>
                        <input
                            id="password"
                            v-model="form.password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Password"
                        />
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input
                            id="remember"
                            v-model="form.remember"
                            name="remember"
                            type="checkbox"
                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="remember" class="ml-2 block text-sm text-gray-900"> Remember me </label>
                    </div>

                    <div class="text-sm">
                        <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500"> Forgot your password? </a>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        :disabled="loading"
                        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span v-if="loading" class="mr-2">
                            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        </span>
                        {{ loading ? 'Signing in...' : 'Sign in' }}
                    </button>
                </div>

                <!-- Error Messages -->
                <div v-if="error" class="rounded-md bg-red-50 p-4">
                    <div class="text-sm text-red-700">
                        {{ error }}
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { LoginForm } from '@/types/chat';

const router = useRouter();
const authStore = useAuthStore();

const form = ref<LoginForm>({
    email: '',
    password: '',
    remember: false,
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
    loading.value = true;
    error.value = '';

    try {
        console.log('🔐 Attempting login with:', form.value);

        const loginResponse = await authStore.login(form.value);
        console.log('✅ Login API successful:', loginResponse);

        // Wait a moment for reactive state to update
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('🔒 Auth state after login:');
        console.log('- Token:', authStore.token);
        console.log('- User:', authStore.currentUser);
        console.log('- isAuthenticated:', authStore.isAuthenticated);

        // Redirect to intended page or chat
        const redirectTo = (router.currentRoute.value.query.redirect as string) || '/';
        console.log('🚀 Attempting redirect to:', redirectTo);

        // Force navigation with replace to avoid navigation loop
        await router.replace(redirectTo);
        console.log('✅ Navigation completed to:', router.currentRoute.value.path);

        // Fallback: force page reload if still on login page
        if (router.currentRoute.value.path === '/login') {
            console.log('🔄 Fallback: Force redirect with window.location');
            window.location.href = redirectTo;
        }
    } catch (err: any) {
        console.error('❌ Login failed:', err);
        error.value = err.response?.data?.message || 'Login failed. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>
