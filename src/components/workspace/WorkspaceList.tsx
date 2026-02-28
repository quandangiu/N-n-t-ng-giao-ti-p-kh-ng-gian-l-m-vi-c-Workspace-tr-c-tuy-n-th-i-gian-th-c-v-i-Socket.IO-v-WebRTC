import React from 'react';
import clsx from 'clsx';
import type { Workspace } from '../../types/workspace.types';

interface WorkspaceListProps {
  workspaces: Workspace[];
  current: Workspace | null;
  onSelect: (ws: Workspace) => void;
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  current,
  onSelect,
}) => {
  if (workspaces.length === 0) {
    return (
      <p className="text-xs text-sidebar-muted px-2 py-1">
        Chưa có workspace
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {workspaces.map((ws) => (
        <button
          key={ws._id}
          onClick={() => onSelect(ws)}
          className={clsx(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left w-full',
            current?._id === ws._id
              ? 'bg-sidebar-active text-white'
              : 'text-sidebar-text hover:bg-sidebar-hover'
          )}
        >
          <span className="text-lg">{ws.icon}</span>
          <span className="truncate">{ws.name}</span>
        </button>
      ))}
    </div>
  );
};
