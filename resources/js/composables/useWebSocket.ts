import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { 
  MessageSentEvent, 
  UserJoinedEvent, 
  UserLeftEvent, 
  UserTypingEvent, 
  UserPresenceEvent 
} from '@/types/chat';

export const useWebSocket = () => {
  const connected = ref(false);
  const connecting = ref(false);
  const error = ref<string | null>(null);
  
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  let echo: Echo | null = null;
  let presenceChannel: any = null;
  let roomChannels: Map<number, any> = new Map();

  const connect = () => {
    if (!authStore.isAuthenticated || connected.value || connecting.value) {
      return;
    }

    // Check if environment variables are set
    if (!import.meta.env.VITE_REVERB_APP_KEY) {
      console.log('ℹ️ WebSocket disabled - missing environment variables');
      return;
    }

    connecting.value = true;
    error.value = null;

    try {
      // Setup Pusher
      window.Pusher = Pusher;

      // Initialize Laravel Echo
      echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
        wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        auth: {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        },
      });

      // Wait for Echo to be fully initialized
      setTimeout(() => {
        try {
          if (!echo || !echo.connector || !echo.connector.socket) {
            throw new Error('Echo connector not available after initialization');
          }

          // Listen for connection events
          echo.connector.socket.on('connect', () => {
            connected.value = true;
            connecting.value = false;
            error.value = null;
            console.log('✅ WebSocket connected');
            joinPresenceChannel();
          });

          echo.connector.socket.on('disconnect', () => {
            connected.value = false;
            connecting.value = false;
            console.log('🔌 WebSocket disconnected');
          });

          echo.connector.socket.on('error', (err: any) => {
            error.value = err.message || 'WebSocket connection error';
            connecting.value = false;
            console.warn('⚠️ WebSocket error:', err);
          });

          echo.connector.socket.on('connect_error', (err: any) => {
            error.value = 'Connection failed - Reverb server may not be running';
            connecting.value = false;
            console.warn('⚠️ WebSocket connection failed:', err.message);
          });

          console.log('✅ WebSocket event listeners registered');

        } catch (socketError: any) {
          error.value = socketError.message;
          connecting.value = false;
          console.warn('⚠️ WebSocket socket setup failed:', socketError.message);
        }
      }, 200);

    } catch (err: any) {
      error.value = err.message || 'Failed to initialize WebSocket';
      connecting.value = false;
      console.warn('⚠️ WebSocket initialization failed:', err.message);
    }
  };

  const disconnect = () => {
    if (echo) {
      // Leave all channels
      leavePresenceChannel();
      leaveAllRoomChannels();
      
      echo.disconnect();
      echo = null;
    }
    
    connected.value = false;
    connecting.value = false;
    error.value = null;
  };

  const joinPresenceChannel = () => {
    if (!echo || !authStore.currentUser) return;

    try {
      presenceChannel = echo.join('online-users')
        .here((users: any[]) => {
          console.log('👥 Currently online users:', users);
        })
        .joining((user: any) => {
          console.log('👋 User joined:', user);
        })
        .leaving((user: any) => {
          console.log('👋 User left:', user);
        })
        .error((error: any) => {
          console.error('❌ Presence channel error:', error);
        });
    } catch (err) {
      console.error('❌ Failed to join presence channel:', err);
    }
  };

  const leavePresenceChannel = () => {
    if (presenceChannel && echo) {
      echo.leave('online-users');
      presenceChannel = null;
    }
  };

  const joinRoomChannel = (roomId: number) => {
    if (!echo || roomChannels.has(roomId)) return;

    try {
      const channel = echo.private(`chat-room.${roomId}`)
        .listen('MessageSent', (event: MessageSentEvent) => {
          chatStore.handleNewMessage(event.data.message);
        })
        .listen('UserJoined', (event: UserJoinedEvent) => {
          console.log('👋 User joined room:', event.data);
        })
        .listen('UserLeft', (event: UserLeftEvent) => {
          console.log('👋 User left room:', event.data);
        })
        .listenForWhisper('typing', (event: UserTypingEvent['data']) => {
          chatStore.handleUserTyping(event);
        })
        .error((error: any) => {
          console.error(`❌ Room ${roomId} channel error:`, error);
        });

      roomChannels.set(roomId, channel);
      console.log(`✅ Joined room channel: ${roomId}`);
    } catch (err) {
      console.error(`❌ Failed to join room ${roomId} channel:`, err);
    }
  };

  const leaveRoomChannel = (roomId: number) => {
    if (roomChannels.has(roomId) && echo) {
      echo.leave(`chat-room.${roomId}`);
      roomChannels.delete(roomId);
      console.log(`👋 Left room channel: ${roomId}`);
    }
  };

  const leaveAllRoomChannels = () => {
    roomChannels.forEach((_, roomId) => {
      leaveRoomChannel(roomId);
    });
  };

  const sendTypingEvent = (roomId: number, isTyping: boolean) => {
    const channel = roomChannels.get(roomId);
    if (channel && authStore.currentUser) {
      channel.whisper('typing', {
        user: authStore.currentUser,
        room_id: roomId,
        is_typing: isTyping,
      });
    }
  };

  const retry = () => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  };

  // Don't auto-connect on mount - let components decide when to connect
  // onMounted(() => {
  //   if (authStore.isAuthenticated) {
  //     connect();
  //   }
  // });

  // Clean up on unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    retry,
    joinRoomChannel,
    leaveRoomChannel,
    sendTypingEvent,
  };
};
