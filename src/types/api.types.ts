export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  user: {
    _id: string;
    username: string;
    email: string;
    avatar: string | null;
    displayName?: string;
  };
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  type: 'mention' | 'dm' | 'reaction' | 'invite';
  actor: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  payload: {
    messageId?: string;
    channelId?: string;
    workspaceId?: string;
    preview?: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
