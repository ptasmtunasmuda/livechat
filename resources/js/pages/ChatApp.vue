<template>
    <div class="min-h-screen bg-gray-50 flex">
        <!-- Sidebar -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
            <!-- Header -->
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h1 class="text-xl font-semibold text-gray-900">Live Chat</h1>
                    <div class="flex items-center space-x-2">
                        <button
                            @click="showCreateRoomModal = true"
                            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Create Room"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>

                        <div class="relative">
                            <button @click="showUserMenu = !showUserMenu" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                                <img :src="authStore.currentUser?.avatar_url" :alt="authStore.currentUser?.name" class="w-8 h-8 rounded-full" />
                            </button>

                            <!-- User Menu Dropdown -->
                            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                <router-link
                                    to="/profile"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    @click="showUserMenu = false"
                                >
                                    Profile
                                </router-link>
                                <button @click="handleLogout" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Room List -->
            <div class="flex-1 overflow-y-auto">
                <div class="p-2">
                    <div
                        v-for="room in chatStore.roomsWithUnread"
                        :key="room.id"
                        @click="selectRoom(room)"
                        class="flex items-center p-3 rounded-lg cursor-pointer transition-colors"
                        :class="{
                            'bg-indigo-50 border-indigo-200': chatStore.currentRoom?.id === room.id,
                            'hover:bg-gray-50': chatStore.currentRoom?.id !== room.id,
                        }"
                    >
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <h3 class="font-medium text-gray-900">{{ room.name }}</h3>
                                <span
                                    v-if="room.unread_count > 0"
                                    class="bg-indigo-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center"
                                >
                                    {{ room.unread_count }}
                                </span>
                            </div>
                            <p v-if="room.latest_message" class="text-sm text-gray-500 truncate">
                                {{ room.latest_message.content }}
                            </p>
                            <p v-else class="text-sm text-gray-400 italic">No messages yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Chat Area -->
        <div class="flex-1 flex flex-col">
            <ChatRoom v-if="chatStore.currentRoom" :room="chatStore.currentRoom" :current-user="authStore.currentUser" />

            <!-- Welcome Screen -->
            <div v-else class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.032 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.032-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-900">Welcome to Live Chat</h3>
                    <p class="mt-1 text-gray-500">Select a room to start chatting</p>
                </div>
            </div>
        </div>

        <!-- Create Room Modal -->
        <CreateRoomModal v-if="showCreateRoomModal" @close="showCreateRoomModal = false" @created="onRoomCreated" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useWebSocket } from '@/composables/useWebSocket';
import ChatRoom from '@/components/Chat/ChatRoom.vue';
import CreateRoomModal from '@/components/Chat/CreateRoomModal.vue';
import type { ChatRoom as ChatRoomType } from '@/types/chat';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();
const webSocket = useWebSocket();

const showUserMenu = ref(false);
const showCreateRoomModal = ref(false);

const selectRoom = async (room: ChatRoomType) => {
    await chatStore.setCurrentRoom(room);

    // WebSocket disabled for now
    console.log(`📍 Selected room: ${room.name}`);

    // Update URL
    router.push(`/room/${room.id}`);
};

const handleLogout = async () => {
    try {
        await authStore.logout();
        router.push('/login');
    } catch (error) {
        console.error('Logout error:', error);
    }
    showUserMenu.value = false;
};

const onRoomCreated = (room: ChatRoomType) => {
    showCreateRoomModal.value = false;
    selectRoom(room);
};

// Initialize data on mount
onMounted(async () => {
    try {
        await chatStore.fetchRooms();

        // WebSocket disabled for stable testing - can be enabled later
        console.log('ℹ️ WebSocket disabled for stable operation');

        // Join room if roomId in route
        const roomId = router.currentRoute.value.params.roomId;
        if (roomId) {
            const room = chatStore.rooms.find((r) => r.id === parseInt(roomId as string));
            if (room) {
                await selectRoom(room);
            }
        }
    } catch (error) {
        console.error('Failed to initialize chat:', error);
    }
});

// Close user menu when clicking outside
const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
        showUserMenu.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    webSocket.disconnect();
});
</script>
