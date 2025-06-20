import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ChatRoom, Message, User, CreateRoomForm, SendMessageForm, ChatState } from '@/types/chat';
import { chatApi } from '@/utils/api';
import { useAuthStore } from './auth';

export const useChatStore = defineStore('chat', () => {
    // State
    const rooms = ref<ChatRoom[]>([]);
    const currentRoom = ref<ChatRoom | null>(null);
    const messages = ref<Record<number, Message[]>>({});
    const typing = ref<Record<number, User[]>>({});
    const loading = ref(false);
    const messagesLoading = ref(false);

    // Getters
    const currentRoomMessages = computed(() => {
        if (!currentRoom.value || !messages.value[currentRoom.value.id]) {
            return [];
        }

        const roomMessages = messages.value[currentRoom.value.id];
        return Array.isArray(roomMessages) ? roomMessages : [];
    });

    const roomsWithUnread = computed(() => {
        if (!Array.isArray(rooms.value)) {
            console.warn('⚠️ rooms.value is not an array:', rooms.value);
            return [];
        }

        return rooms.value.map((room) => ({
            ...room,
            unread_count: room.unread_count || 0,
        }));
    });

    const typingUsers = computed(() => (currentRoom.value ? typing.value[currentRoom.value.id] || [] : []));

    // Actions
    const fetchRooms = async () => {
        loading.value = true;
        try {
            const response = await chatApi.getRooms();
            console.log('🏠 Rooms API response:', response); // Debug log

            // Handle different response formats
            if (Array.isArray(response.data)) {
                rooms.value = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                rooms.value = response.data.data;
            } else {
                console.warn('⚠️ Unexpected rooms data format:', response.data);
                rooms.value = [];
            }

            console.log('🏠 Rooms set to:', rooms.value);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            rooms.value = []; // Set empty array to prevent map error
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const createRoom = async (roomData: CreateRoomForm) => {
        loading.value = true;
        try {
            const response = await chatApi.createRoom(roomData);
            rooms.value.unshift(response.data);
            return response.data;
        } catch (error) {
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const joinRoom = async (roomId: number) => {
        loading.value = true;
        try {
            const response = await chatApi.joinRoom(roomId);

            // Update rooms list if room wasn't already there
            const existingRoomIndex = rooms.value.findIndex((r) => r.id === roomId);
            if (existingRoomIndex === -1) {
                rooms.value.push(response.data);
            }

            return response.data;
        } catch (error) {
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const leaveRoom = async (roomId: number) => {
        loading.value = true;
        try {
            await chatApi.leaveRoom(roomId);

            // Remove room from list
            rooms.value = rooms.value.filter((r) => r.id !== roomId);

            // Clear messages for this room
            delete messages.value[roomId];

            // Clear current room if it's the one being left
            if (currentRoom.value?.id === roomId) {
                currentRoom.value = null;
            }
        } catch (error) {
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const setCurrentRoom = async (room: ChatRoom) => {
        currentRoom.value = room;

        // Fetch messages if not already loaded
        if (!messages.value[room.id]) {
            await fetchMessages(room.id);
        }

        // Mark room as read
        await markRoomAsRead(room.id);
    };

    const fetchMessages = async (roomId: number, page = 1) => {
        messagesLoading.value = true;
        try {
            const response = await chatApi.getMessages(roomId, page);
            console.log('📨 Messages API response:', response.data);

            // Handle paginated response
            const messagesData = response.data.data || [];

            if (page === 1) {
                messages.value[roomId] = messagesData;
            } else {
                // Prepend older messages
                messages.value[roomId] = [...messagesData, ...(messages.value[roomId] || [])];
            }

            console.log('📨 Messages set to:', messages.value[roomId]);

            return response.data;
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            // Set empty array on error to prevent component crashes
            messages.value[roomId] = [];
            throw error;
        } finally {
            messagesLoading.value = false;
        }
    };

    const sendMessage = async (roomId: number, messageData: SendMessageForm) => {
        try {
            const response = await chatApi.sendMessage(roomId, messageData);

            // Add message to local state
            if (!messages.value[roomId]) {
                messages.value[roomId] = [];
            }
            messages.value[roomId].push(response.data);

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const editMessage = async (messageId: number, content: string) => {
        try {
            const response = await chatApi.editMessage(messageId, { content });

            // Update message in local state
            Object.keys(messages.value).forEach((roomId) => {
                const messageIndex = messages.value[parseInt(roomId)].findIndex((m) => m.id === messageId);
                if (messageIndex !== -1) {
                    messages.value[parseInt(roomId)][messageIndex] = response.data;
                }
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const deleteMessage = async (messageId: number) => {
        try {
            await chatApi.deleteMessage(messageId);

            // Remove message from local state
            Object.keys(messages.value).forEach((roomId) => {
                messages.value[parseInt(roomId)] = messages.value[parseInt(roomId)].filter((m) => m.id !== messageId);
            });
        } catch (error) {
            throw error;
        }
    };

    const markRoomAsRead = async (roomId: number) => {
        try {
            await chatApi.markRoomAsRead(roomId);

            // Update unread count in local state
            const room = rooms.value.find((r) => r.id === roomId);
            if (room) {
                room.unread_count = 0;
            }
        } catch (error) {
            console.error('Failed to mark room as read:', error);
        }
    };

    // WebSocket event handlers
    const handleNewMessage = (message: Message) => {
        if (!messages.value[message.room_id]) {
            messages.value[message.room_id] = [];
        }

        // Check if message already exists (avoid duplicates)
        const existingMessage = messages.value[message.room_id].find((m) => m.id === message.id);
        if (!existingMessage) {
            messages.value[message.room_id].push(message);

            // Update room's unread count if not current room
            if (currentRoom.value?.id !== message.room_id) {
                const room = rooms.value.find((r) => r.id === message.room_id);
                if (room) {
                    room.unread_count = (room.unread_count || 0) + 1;
                }
            }
        }
    };

    const handleUserTyping = (data: { user: User; room_id: number; is_typing: boolean }) => {
        if (!typing.value[data.room_id]) {
            typing.value[data.room_id] = [];
        }

        const authStore = useAuthStore();

        // Don't show typing indicator for current user
        if (data.user.id === authStore.currentUser?.id) {
            return;
        }

        if (data.is_typing) {
            // Add user to typing list if not already there
            const existingUser = typing.value[data.room_id].find((u) => u.id === data.user.id);
            if (!existingUser) {
                typing.value[data.room_id].push(data.user);
            }
        } else {
            // Remove user from typing list
            typing.value[data.room_id] = typing.value[data.room_id].filter((u) => u.id !== data.user.id);
        }
    };

    const clearTyping = (roomId: number) => {
        typing.value[roomId] = [];
    };

    return {
        // State
        rooms,
        currentRoom,
        messages,
        typing,
        loading,
        messagesLoading,

        // Getters
        currentRoomMessages,
        roomsWithUnread,
        typingUsers,

        // Actions
        fetchRooms,
        createRoom,
        joinRoom,
        leaveRoom,
        setCurrentRoom,
        fetchMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        markRoomAsRead,

        // WebSocket handlers
        handleNewMessage,
        handleUserTyping,
        clearTyping,
    };
});
