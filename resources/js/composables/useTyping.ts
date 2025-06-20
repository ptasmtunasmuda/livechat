import { ref, onUnmounted } from 'vue';
import { useWebSocket } from './useWebSocket';

export const useTyping = (roomId: number) => {
    const isTyping = ref(false);
    const typingTimeout = ref<NodeJS.Timeout | null>(null);

    const { sendTypingEvent } = useWebSocket();

    const startTyping = () => {
        if (!isTyping.value) {
            isTyping.value = true;
            sendTypingEvent(roomId, true);
        }

        // Clear existing timeout
        if (typingTimeout.value) {
            clearTimeout(typingTimeout.value);
        }

        // Set new timeout to stop typing after 3 seconds of inactivity
        typingTimeout.value = setTimeout(() => {
            stopTyping();
        }, 3000);
    };

    const stopTyping = () => {
        if (isTyping.value) {
            isTyping.value = false;
            sendTypingEvent(roomId, false);
        }

        if (typingTimeout.value) {
            clearTimeout(typingTimeout.value);
            typingTimeout.value = null;
        }
    };

    // Clean up on unmount
    onUnmounted(() => {
        stopTyping();
    });

    return {
        isTyping,
        startTyping,
        stopTyping,
    };
};
