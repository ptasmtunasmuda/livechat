<template>
    <div class="p-4">
        <h3 class="text-sm font-medium text-gray-900 mb-4">Members ({{ users.length }})</h3>

        <div class="space-y-2">
            <div v-for="user in users" :key="user.id" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <!-- Avatar with status indicator -->
                <div class="relative">
                    <img :src="user.avatar_url" :alt="user.name" class="w-8 h-8 rounded-full" />
                    <div
                        v-if="showPresence"
                        class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                        :class="getStatusColor(user)"
                        :title="getStatusText(user)"
                    />
                </div>

                <!-- User info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            {{ user?.name || 'Unknown User' }}
                        </p>
                        <span v-if="user?.id === currentUser?.id" class="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full"> You </span>
                    </div>
                    <p v-if="user?.bio" class="text-xs text-gray-500 truncate">
                        {{ user.bio }}
                    </p>
                    <p v-else-if="showPresence && !user?.is_online" class="text-xs text-gray-400">
                        {{ getLastSeenText(user) }}
                    </p>
                </div>

                <!-- User menu -->
                <div class="relative">
                    <button
                        v-if="user?.id && currentUser?.id && user.id !== currentUser.id"
                        @click="toggleUserMenu(user.id)"
                        class="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                        </svg>
                    </button>

                    <!-- Dropdown menu -->
                    <div v-if="user?.id && activeMenu === user.id" class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button @click="startDirectMessage(user)" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Send Direct Message
                        </button>
                        <button @click="viewProfile(user)" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { User } from '@/types/chat';

interface Props {
    users: User[];
    currentUser: User;
    showPresence?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showPresence: true,
});

const activeMenu = ref<number | null>(null);

// Methods
const getStatusColor = (user: User) => {
    if (!user.is_online) return 'bg-gray-400';
    return 'bg-green-500';
};

const getStatusText = (user: User) => {
    return user.is_online ? 'Online' : 'Offline';
};

const getLastSeenText = (user: User) => {
    if (!user?.last_activity) return 'Never seen';

    const lastSeen = new Date(user.last_activity);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
};

const toggleUserMenu = (userId: number) => {
    activeMenu.value = activeMenu.value === userId ? null : userId;
};

const startDirectMessage = (user: User) => {
    // TODO: Implement direct message functionality
    console.log('Start DM with:', user.name);
    activeMenu.value = null;
};

const viewProfile = (user: User) => {
    // TODO: Implement profile view
    console.log('View profile:', user.name);
    activeMenu.value = null;
};

// Close menu when clicking outside
const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
        activeMenu.value = null;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>
