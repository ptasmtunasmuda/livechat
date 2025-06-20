import axios from 'axios';
import type { ApiResponse, PaginatedResponse, LoginForm, RegisterForm, User, ChatRoom, CreateRoomForm, Message, SendMessageForm } from '@/types/chat';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    // withCredentials: false untuk token-based auth (bukan session-based)
    withCredentials: false,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

// Authentication API
export const authApi = {
    login: (credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => api.post('/login', credentials),

    register: (userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> => api.post('/register', userData),

    logout: (): Promise<ApiResponse> => api.post('/logout'),

    me: (): Promise<ApiResponse<User>> => api.get('/user'),

    updateProfile: (profileData: Partial<User>): Promise<ApiResponse<User>> => api.put('/user/profile', profileData),
};

// Chat API
export const chatApi = {
    // Rooms
    getRooms: (): Promise<ApiResponse<ChatRoom[]>> => api.get('/rooms'),

    getRoom: (roomId: number): Promise<ApiResponse<ChatRoom>> => api.get(`/rooms/${roomId}`),

    createRoom: (roomData: CreateRoomForm): Promise<ApiResponse<ChatRoom>> => api.post('/rooms', roomData),

    updateRoom: (roomId: number, roomData: Partial<ChatRoom>): Promise<ApiResponse<ChatRoom>> => api.put(`/rooms/${roomId}`, roomData),

    deleteRoom: (roomId: number): Promise<ApiResponse> => api.delete(`/rooms/${roomId}`),

    joinRoom: (roomId: number): Promise<ApiResponse<ChatRoom>> => api.post(`/rooms/${roomId}/join`),

    leaveRoom: (roomId: number): Promise<ApiResponse> => api.post(`/rooms/${roomId}/leave`),

    // Messages
    getMessages: (roomId: number, page = 1): Promise<ApiResponse<PaginatedResponse<Message>>> => api.get(`/rooms/${roomId}/messages?page=${page}`),

    sendMessage: (roomId: number, messageData: SendMessageForm): Promise<ApiResponse<Message>> => {
        if (messageData.attachments && messageData.attachments.length > 0) {
            // Handle file upload
            const formData = new FormData();
            formData.append('content', messageData.content);
            formData.append('type', messageData.type || 'text');

            if (messageData.reply_to) {
                formData.append('reply_to', messageData.reply_to.toString());
            }

            messageData.attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });

            return api.post(`/rooms/${roomId}/messages`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }

        return api.post(`/rooms/${roomId}/messages`, messageData);
    },

    editMessage: (messageId: number, data: { content: string }): Promise<ApiResponse<Message>> => api.put(`/messages/${messageId}`, data),

    deleteMessage: (messageId: number): Promise<ApiResponse> => api.delete(`/messages/${messageId}`),

    markRoomAsRead: (roomId: number): Promise<ApiResponse> => api.post(`/rooms/${roomId}/read`),

    // Search
    searchMessages: (roomId: number, query: string): Promise<ApiResponse<Message[]>> =>
        api.get(`/rooms/${roomId}/messages/search?q=${encodeURIComponent(query)}`),
};

// File API
export const fileApi = {
    uploadAvatar: (file: File): Promise<ApiResponse<{ url: string }>> => {
        const formData = new FormData();
        formData.append('avatar', file);

        return api.post('/user/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    downloadAttachment: (attachmentId: number): Promise<Blob> =>
        api
            .get(`/attachments/${attachmentId}/download`, {
                responseType: 'blob',
            })
            .then((response) => response.data),
};

// Presence API
export const presenceApi = {
    updateStatus: (status: 'online' | 'away' | 'busy' | 'offline'): Promise<ApiResponse> => api.post('/user/presence', { status }),

    getOnlineUsers: (): Promise<ApiResponse<User[]>> => api.get('/users/online'),
};

export default api;
