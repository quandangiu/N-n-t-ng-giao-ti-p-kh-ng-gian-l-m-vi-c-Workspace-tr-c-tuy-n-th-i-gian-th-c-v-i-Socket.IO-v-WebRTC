export interface Attachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  publicId: string;
}

export interface ReadByEntry {
  user: string;
  readAt: string;
}

export interface Message {
  _id: string;
  channel: string;
  sender: {
    _id: string;
    username: string;
    avatar: string | null;
    displayName?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachment?: Attachment;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
    };
  } | null;
  reactions: Record<string, string[]>; // emoji → userId[]
  readBy: ReadByEntry[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  isPending?: boolean; // optimistic UI
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  channelId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  replyTo?: string | null;
  attachment?: Attachment;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}
