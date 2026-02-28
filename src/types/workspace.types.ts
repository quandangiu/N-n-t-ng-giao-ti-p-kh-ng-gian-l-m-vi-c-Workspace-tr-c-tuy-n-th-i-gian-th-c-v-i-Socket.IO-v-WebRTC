export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  owner: string;
  members: WorkspaceMember[];
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  user: string | {
    _id: string;
    username: string;
    avatar: string | null;
    displayName?: string;
    status: 'online' | 'offline' | 'away';
  };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}
