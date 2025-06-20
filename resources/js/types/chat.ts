// Chat related types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  is_online: boolean;
  last_activity?: string;
  preferences?: Record<string, any>;
  avatar_url: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  slug: string;
  type: 'public' | 'private' | 'direct';
  description?: string;
  created_by: number;
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator?: User;
  members?: RoomMember[];
  messages?: Message[];
  latest_message?: Message;
  unread_count?: number;
}

export interface RoomMember {
  id: number;
  room_id: number;
  user_id: number;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  user?: User;
  room?: ChatRoom;
}

export interface Message {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  metadata?: Record<string, any>;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  room?: ChatRoom;
  attachments?: MessageAttachment[];
  reply_to?: Message;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  url: string;
  download_url: string;
  formatted_size: string;
  is_image: boolean;
  is_document: boolean;
}

export interface UserPresence {
  id: number;
  user_id: number;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  socket_id?: string;
  user?: User;
  last_seen_human: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  prev_page_url?: string;
  next_page_url?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface CreateRoomForm {
  name: string;
  type: 'public' | 'private';
  description?: string;
}

export interface SendMessageForm {
  content: string;
  type?: 'text' | 'file' | 'image';
  reply_to?: number;
  attachments?: File[];
}

// Event types for WebSocket
export interface ChatEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface MessageSentEvent extends ChatEvent {
  type: 'message.sent';
  data: {
    message: Message;
    room_id: number;
  };
}

export interface UserJoinedEvent extends ChatEvent {
  type: 'user.joined';
  data: {
    user: User;
    room_id: number;
  };
}

export interface UserLeftEvent extends ChatEvent {
  type: 'user.left';
  data: {
    user: User;
    room_id: number;
  };
}

export interface UserTypingEvent extends ChatEvent {
  type: 'user.typing';
  data: {
    user: User;
    room_id: number;
    is_typing: boolean;
  };
}

export interface UserPresenceEvent extends ChatEvent {
  type: 'user.presence';
  data: {
    user: User;
    status: 'online' | 'offline' | 'away' | 'busy';
  };
}

// Utility types
export type MessageType = Message['type'];
export type RoomType = ChatRoom['type'];
export type UserRole = RoomMember['role'];
export type PresenceStatus = UserPresence['status'];

// Component prop types
export interface ChatRoomProps {
  room: ChatRoom;
  currentUser: User;
}

export interface MessageListProps {
  messages: Message[];
  currentUser: User;
  loading?: boolean;
}

export interface MessageInputProps {
  roomId: number;
  placeholder?: string;
  disabled?: boolean;
}

export interface UserListProps {
  users: User[];
  currentUser: User;
  showPresence?: boolean;
}

// Store state types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Record<number, Message[]>;
  typing: Record<number, User[]>;
  loading: boolean;
}

export interface PresenceState {
  users: Record<number, UserPresence>;
  onlineUsers: User[];
}
