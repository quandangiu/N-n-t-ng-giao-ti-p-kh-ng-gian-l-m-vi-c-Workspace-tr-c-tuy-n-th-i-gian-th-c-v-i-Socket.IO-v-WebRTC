export interface VoiceMember {
  userId: string;
  username: string;
  displayName?: string;
  avatar: string | null;
  joinedAt: string;   // ISO – dùng để tính thời gian
  isMuted?: boolean;
  isDeafened?: boolean;
}

export interface Channel {
  _id: string;
  workspace: string;
  name: string;
  type: 'public' | 'private' | 'dm' | 'voice';
  description?: string;
  members: string[];
  createdBy: string;
  lastMessage?: string;
  lastActivity: string;
  dmUsers?: string[];
  encryptionEnabled?: boolean;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelPayload {
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'voice';
  description?: string;
  encryptionEnabled?: boolean;
}

export interface CreateDMPayload {
  workspaceId: string;
  targetUserId: string;
}
