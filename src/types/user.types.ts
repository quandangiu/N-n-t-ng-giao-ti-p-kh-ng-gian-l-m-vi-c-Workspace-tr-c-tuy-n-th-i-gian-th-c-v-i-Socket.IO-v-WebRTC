export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  displayName?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchResult {
  _id: string;
  username: string;
  avatar: string | null;
  displayName?: string;
  status: 'online' | 'offline' | 'away';
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  avatar?: File;
}
