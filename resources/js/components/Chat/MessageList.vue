<template>
  <div class="flex-1 overflow-y-auto" ref="messagesContainer">
    <!-- Loading indicator -->
    <div v-if="loading && messages.length === 0" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Load more button -->
    <div v-if="messages.length > 0" class="text-center py-4">
      <button
        @click="$emit('loadMore')"
        :disabled="loading"
        class="text-indigo-600 hover:text-indigo-700 text-sm font-medium disabled:opacity-50"
      >
        {{ loading ? 'Loading...' : 'Load more messages' }}
      </button>
    </div>

    <!-- Messages -->
    <div class="px-6 py-4 space-y-4">
      <div
        v-for="(message, index) in messages"
        :key="message?.id || index"
        class="flex space-x-3"
        :class="{
          'flex-row-reverse space-x-reverse': message?.user_id === currentUser?.id
        }"
      >
        <!-- Avatar -->
        <img
          :src="message?.user?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff'"
          :alt="message?.user?.name || 'User'"
          class="w-8 h-8 rounded-full flex-shrink-0"
        />

        <!-- Message content -->
        <div class="flex-1 max-w-xs lg:max-w-md">
          <!-- Message header -->
          <div class="flex items-center space-x-2 mb-1">
            <span class="text-sm font-medium text-gray-900">
              {{ message?.user?.name || 'Unknown User' }}
            </span>
            <span class="text-xs text-gray-500">
              {{ message?.created_at ? formatTime(message.created_at) : '' }}
            </span>
            <span v-if="message?.is_edited" class="text-xs text-gray-400">(edited)</span>
          </div>

          <!-- Message bubble -->
          <div
            class="relative rounded-lg px-4 py-2"
            :class="{
              'bg-indigo-600 text-white': message?.user_id === currentUser?.id,
              'bg-gray-100 text-gray-900': message?.user_id !== currentUser?.id
            }"
          >
            <!-- Reply context -->
            <div
              v-if="message?.metadata?.reply_to"
              class="mb-2 p-2 rounded border-l-2"
              :class="{
                'border-white/20 bg-white/10': message?.user_id === currentUser?.id,
                'border-gray-300 bg-gray-50': message?.user_id !== currentUser?.id
              }"
            >
              <div class="text-xs opacity-75">
                Replying to: {{ getReplyContent(message.metadata.reply_to) }}
              </div>
            </div>

            <!-- Message text -->
            <div v-if="editingMessage === message?.id">
              <input
                v-model="editContent"
                @keyup.enter="saveEdit(message.id)"
                @keyup.escape="cancelEdit"
                class="w-full bg-transparent border-none outline-none text-inherit placeholder-current/50"
                placeholder="Edit message..."
                ref="editInput"
              />
              <div class="flex justify-end space-x-2 mt-2">
                <button
                  @click="saveEdit(message.id)"
                  class="text-xs underline opacity-75 hover:opacity-100"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="text-xs underline opacity-75 hover:opacity-100"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div v-else>
              <p class="text-sm">{{ message?.content || 'No content' }}</p>
            </div>

            <!-- Attachments -->
            <div v-if="message?.attachments?.length" class="mt-2 space-y-2">
              <div
                v-for="attachment in message.attachments"
                :key="attachment.id"
                class="flex items-center space-x-2 p-2 rounded"
                :class="{
                  'bg-white/10': message?.user_id === currentUser?.id,
                  'bg-gray-200': message?.user_id !== currentUser?.id
                }"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span class="text-xs">{{ attachment.file_name }}</span>
                <span class="text-xs opacity-75">({{ attachment.formatted_size }})</span>
              </div>
            </div>

            <!-- Message actions -->
            <div
              v-if="message?.user_id === currentUser?.id && message && canEdit(message)"
              class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div class="flex space-x-1">
                <button
                  v-if="message?.type === 'text'"
                  @click="startEdit(message)"
                  class="p-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  title="Edit"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="$emit('deleteMessage', message.id)"
                  class="p-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  title="Delete"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import type { Message, User } from '@/types/chat';

interface Props {
  messages: Message[];
  currentUser: User;
  loading?: boolean;
}

interface Emits {
  (e: 'loadMore'): void;
  (e: 'editMessage', messageId: number, content: string): void;
  (e: 'deleteMessage', messageId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const messagesContainer = ref<HTMLElement>();
const editingMessage = ref<number | null>(null);
const editContent = ref('');
const editInput = ref<HTMLInputElement>();

// Methods
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getReplyContent = (messageId: number) => {
  const message = props.messages.find(m => m.id === messageId);
  return message?.content?.substring(0, 50) + '...' || 'Message not found';
};

const canEdit = (message: Message) => {
  const messageAge = Date.now() - new Date(message.created_at).getTime();
  return messageAge < 15 * 60 * 1000; // 15 minutes
};

const startEdit = async (message: Message) => {
  editingMessage.value = message.id;
  editContent.value = message.content;
  
  await nextTick();
  editInput.value?.focus();
};

const saveEdit = (messageId: number) => {
  if (editContent.value.trim()) {
    emit('editMessage', messageId, editContent.value.trim());
  }
  cancelEdit();
};

const cancelEdit = () => {
  editingMessage.value = null;
  editContent.value = '';
};

// Auto-scroll to bottom when new messages arrive
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(
  () => props.messages.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      nextTick(scrollToBottom);
    }
  }
);
</script>

<style scoped>
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
</style>
