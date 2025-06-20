<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center">
                        <router-link to="/" class="flex items-center text-gray-600 hover:text-gray-900">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Chat
                        </router-link>
                    </div>
                    <h1 class="text-lg font-semibold text-gray-900">Profile Settings</h1>
                    <div></div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div class="bg-white shadow rounded-lg">
                <!-- Profile Header -->
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            <img :src="authStore.currentUser?.avatar_url" :alt="authStore.currentUser?.name" class="w-16 h-16 rounded-full" />
                            <label
                                for="avatar-upload"
                                class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
                            >
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" @change="handleAvatarUpload" class="hidden" />
                        </div>
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">{{ authStore.currentUser?.name }}</h2>
                            <p class="text-gray-500">{{ authStore.currentUser?.email }}</p>
                            <div class="flex items-center mt-1">
                                <div class="w-2 h-2 rounded-full mr-2" :class="authStore.currentUser?.is_online ? 'bg-green-500' : 'bg-gray-400'" />
                                <span class="text-sm text-gray-500">
                                    {{ authStore.currentUser?.is_online ? 'Online' : 'Offline' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Form -->
                <form @submit.prevent="updateProfile" class="p-6 space-y-6">
                    <!-- Name -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2"> Full Name </label>
                        <input
                            id="name"
                            v-model="form.name"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name[0] }}</p>
                    </div>

                    <!-- Bio -->
                    <div>
                        <label for="bio" class="block text-sm font-medium text-gray-700 mb-2"> Bio </label>
                        <textarea
                            id="bio"
                            v-model="form.bio"
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Tell others about yourself..."
                        />
                        <p v-if="errors.bio" class="mt-1 text-sm text-red-600">{{ errors.bio[0] }}</p>
                    </div>

                    <!-- Email (readonly) -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2"> Email Address </label>
                        <input
                            id="email"
                            :value="authStore.currentUser?.email"
                            type="email"
                            readonly
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p class="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            @click="resetForm"
                            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            :disabled="loading || !hasChanges"
                            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span v-if="loading" class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Saving...
                            </span>
                            <span v-else>Save Changes</span>
                        </button>
                    </div>

                    <!-- Success/Error Messages -->
                    <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
                        <div class="flex">
                            <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <div class="ml-3">
                                <p class="text-sm text-green-700">{{ successMessage }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
                        <div class="flex">
                            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <div class="ml-3">
                                <p class="text-sm text-red-700">{{ errorMessage }}</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { fileApi } from '@/utils/api';

const authStore = useAuthStore();

const form = reactive({
    name: '',
    bio: '',
});

const loading = ref(false);
const errors = ref<Record<string, string[]>>({});
const successMessage = ref('');
const errorMessage = ref('');

// Computed
const hasChanges = computed(() => {
    const user = authStore.currentUser;
    if (!user) return false;

    return form.name !== user.name || form.bio !== (user.bio || '');
});

// Methods
const resetForm = () => {
    const user = authStore.currentUser;
    if (user) {
        form.name = user.name;
        form.bio = user.bio || '';
    }
};

const updateProfile = async () => {
    loading.value = true;
    errors.value = {};
    successMessage.value = '';
    errorMessage.value = '';

    try {
        await authStore.updateProfile({
            name: form.name,
            bio: form.bio,
        });

        successMessage.value = 'Profile updated successfully!';

        // Clear success message after 3 seconds
        setTimeout(() => {
            successMessage.value = '';
        }, 3000);
    } catch (err: any) {
        if (err.response?.data?.errors) {
            errors.value = err.response.data.errors;
        } else {
            errorMessage.value = err.response?.data?.message || 'Failed to update profile. Please try again.';
        }
    } finally {
        loading.value = false;
    }
};

const handleAvatarUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        errorMessage.value = 'Avatar must be less than 2MB';
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        errorMessage.value = 'Avatar must be an image file';
        return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
        const response = await fileApi.uploadAvatar(file);

        // Update user avatar in store
        await authStore.fetchUser();

        successMessage.value = 'Avatar updated successfully!';

        // Clear success message after 3 seconds
        setTimeout(() => {
            successMessage.value = '';
        }, 3000);
    } catch (err: any) {
        errorMessage.value = err.response?.data?.message || 'Failed to upload avatar. Please try again.';
    } finally {
        loading.value = false;
        // Clear the file input
        target.value = '';
    }
};

// Initialize form
onMounted(() => {
    resetForm();
});
</script>
