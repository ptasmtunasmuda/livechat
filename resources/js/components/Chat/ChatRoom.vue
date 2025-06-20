<template>
  <div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ room.name }}</h2>
          <p class="text-sm text-gray-500">{{ room.description || `${room.members?.length || 0} members` }}</p>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- Online members count -->
          <div class="flex items-center space-x-1 text-sm text-gray-500">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{{ onlineCount }} online</span>
          </div>
          
          <!-- Room menu -->
          <button
            @click="showRoomMenu = !showRoomMenu"
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 flex">
      <!-- Message List -->
      <div class="flex-1 flex flex-col">
        <MessageList
          :messages="chatStore.currentRoomMessages"
          :current-user="currentUser || {}"
          :loading="chatStore.messagesLoading"
          @load-more="loadMoreMessages"
          @edit-message="editMessage"
          @delete-message="deleteMessage"
        />
        
        <!-- Typing Indicator -->
        <div v-if="chatStore.typingUsers.length > 0" class="px-6 py-2">
          <div class="text-sm text-gray-500">
            {{ typingText }}
          </div>
        </div>
        
        <!-- Message Input -->
        <MessageInput
          v-if="room && room.id"
          :room-id="room.id"
          @message-sent="onMessageSent"
        />
      </div>
      
      <!-- User List Sidebar (for larger screens) -->
      <div class="hidden lg:block w-64 bg-gray-50 border-l border-gray-200">
        <UserList
          :users="roomMembers"
          :current-user="currentUser || {}"
          :show-presence="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useWebSocket } from '@/composables/useWebSocket';
import MessageList from '@/components/Chat/MessageList.vue';
import MessageInput from '@/components/Chat/MessageInput.vue';
import UserList from '@/components/Chat/UserList.vue';
import type { ChatRoom, User, Message } from '@/types/chat';

interface Props {
  room: ChatRoom;
  currentUser: User;
}

const props = defineProps<Props>();

const chatStore = useChatStore();
const webSocket = useWebSocket();

const showRoomMenu = ref(false);

// Computed properties
const roomMembers = computed(() => 
  props.room?.members?.map(member => member.user).filter(Boolean) || []
);

const onlineCount = computed(() => 
  roomMembers.value.filter(user => user?.is_online).length
);

const typingText = computed(() => {
  const users = chatStore.typingUsers;
  if (users.length === 0) return '';
  
  if (users.length === 1) {
    return `${users[0].name} is typing...`;
  } else if (users.length === 2) {
    return `${users[0].name} and ${users[1].name} are typing...`;
  } else {
    return `${users[0].name} and ${users.length - 1} others are typing...`;
  }
});

// Methods
const loadMoreMessages = async () => {
  try {
    // Get current page from existing messages
    const currentPage = Math.ceil(chatStore.currentRoomMessages.length / 50) + 1;
    await chatStore.fetchMessages(props.room.id, currentPage);
  } catch (error) {
    console.error('Failed to load more messages:', error);
  }
};

const editMessage = async (messageId: number, newContent: string) => {
  try {
    await chatStore.editMessage(messageId, newContent);
  } catch (error) {
    console.error('Failed to edit message:', error);
  }
};

const deleteMessage = async (messageId: number) => {
  if (confirm('Are you sure you want to delete this message?')) {
    try {
      await chatStore.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }
};

const onMessageSent = (message: Message) => {
  // Message is automatically added to store via WebSocket event
  console.log('Message sent:', message);
};

// Lifecycle
onMounted(() => {
  // Join room channel for real-time updates
  webSocket.joinRoomChannel(props.room.id);
});

onUnmounted(() => {
  // Leave room channel
  webSocket.leaveRoomChannel(props.room.id);
  
  // Clear typing indicators
  chatStore.clearTyping(props.room.id);
});
</script>
