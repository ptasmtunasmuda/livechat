<template>
    <div class="bg-white border-t border-gray-200 p-4">
        <!-- File upload preview -->
        <div v-if="selectedFiles.length > 0" class="mb-4">
            <div class="flex flex-wrap gap-2">
                <div v-for="(file, index) in selectedFiles" :key="index" class="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                    <span class="text-sm text-gray-700">{{ file.name }}</span>
                    <button @click="removeFile(index)" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Reply preview -->
        <div v-if="replyingTo" class="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-xs text-gray-500">Replying to {{ replyingTo.user?.name }}</div>
                    <div class="text-sm text-gray-700">{{ replyingTo.content.substring(0, 100) }}...</div>
                </div>
                <button @click="replyingTo = null" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Input area -->
        <div class="flex items-end space-x-3">
            <!-- File upload button -->
            <div class="flex-shrink-0">
                <input ref="fileInput" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" @change="handleFileSelect" class="hidden" />
                <button
                    @click="$refs.fileInput?.click()"
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Attach file"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                </button>
            </div>

            <!-- Message input -->
            <div class="flex-1">
                <textarea
                    v-model="message"
                    @keydown.enter.exact.prevent="sendMessage"
                    @keydown.shift.enter.exact="() => {}"
                    @input="handleTyping"
                    :placeholder="placeholder"
                    :disabled="disabled || sending"
                    rows="1"
                    class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style="min-height: 40px; max-height: 120px"
                    ref="textareaRef"
                />
            </div>

            <!-- Send button -->
            <div class="flex-shrink-0">
                <button
                    @click="sendMessage"
                    :disabled="!canSend || sending"
                    class="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <svg v-if="sending" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Keyboard shortcuts hint -->
        <div class="mt-2 text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useTyping } from '@/composables/useTyping';
import type { Message, SendMessageForm } from '@/types/chat';

interface Props {
    roomId: number;
    placeholder?: string;
    disabled?: boolean;
}

interface Emits {
    (e: 'messageSent', message: Message): void;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Type a message...',
    disabled: false,
});

const emit = defineEmits<Emits>();

const chatStore = useChatStore();
const { startTyping, stopTyping } = useTyping(props.roomId);

const message = ref('');
const selectedFiles = ref<File[]>([]);
const replyingTo = ref<Message | null>(null);
const sending = ref(false);
const textareaRef = ref<HTMLTextAreaElement>();
const fileInput = ref<HTMLInputElement>();

// Computed
const canSend = computed(() => (message.value.trim().length > 0 || selectedFiles.value.length > 0) && !props.disabled);

// Methods
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        const newFiles = Array.from(target.files);
        selectedFiles.value.push(...newFiles);

        // Clear the input so the same file can be selected again
        target.value = '';
    }
};

const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1);
};

const handleTyping = () => {
    if (message.value.trim().length > 0) {
        startTyping();
    } else {
        stopTyping();
    }

    // Auto-resize textarea
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto';
            textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px';
        }
    });
};

const sendMessage = async () => {
    if (!canSend.value || sending.value) return;

    const messageContent = message.value.trim();
    const files = [...selectedFiles.value];
    const replyTo = replyingTo.value?.id;

    // Clear form immediately
    message.value = '';
    selectedFiles.value = [];
    replyingTo.value = null;
    stopTyping();

    // Reset textarea height
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto';
    }

    sending.value = true;

    try {
        const messageData: SendMessageForm = {
            content: messageContent,
            type: files.length > 0 ? 'file' : 'text',
        };

        if (replyTo) {
            messageData.reply_to = replyTo;
        }

        if (files.length > 0) {
            messageData.attachments = files;
        }

        const sentMessage = await chatStore.sendMessage(props.roomId, messageData);
        emit('messageSent', sentMessage);
    } catch (error) {
        console.error('Failed to send message:', error);

        // Restore form data on error
        message.value = messageContent;
        selectedFiles.value = files;
        if (replyTo) {
            // Note: We'd need to find the original message to restore replyingTo
        }
    } finally {
        sending.value = false;
    }
};

// Watch for message changes to handle typing
watch(message, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        handleTyping();
    }
});

// Expose method to set reply
const setReplyTo = (message: Message) => {
    replyingTo.value = message;
    textareaRef.value?.focus();
};

defineExpose({
    setReplyTo,
});
</script>
