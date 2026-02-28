import React, { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { WorkspaceNav } from '../workspace/WorkspaceNav';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { workspaceService } from '../../services/workspace.service';
import { useSocket } from '../../hooks/useSocket';
import { VoiceProvider } from '../../context/VoiceContext';
import clsx from 'clsx';

/**
 * Layout chính: WorkspaceNav (72px) + Sidebar (240px) + Main content
 * Theo kiểu Discord
 */
export const AppLayout: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const theme = useUIStore((s) => s.theme);
  const navigate = useNavigate();
  const { slug } = useParams();
  const { workspaces, current, setWorkspaces, setCurrent } = useWorkspaceStore();

  // Kết nối socket khi vào layout chính
  useSocket();

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Load workspaces
  useEffect(() => {
    const load = async () => {
      try {
        const data = await workspaceService.getAll();
        setWorkspaces(data);
        if (slug) {
          const ws = data.find((w) => w.slug === slug);
          if (ws) setCurrent(ws);
        } else if (data.length > 0 && !current) {
          setCurrent(data[0]);
          navigate(`/workspace/${data[0].slug}`);
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      }
    };
    load();
  }, []);

  const handleSelectWorkspace = (ws: typeof current) => {
    if (!ws) return;
    setCurrent(ws);
    navigate(`/workspace/${ws.slug}`);
  };

  return (
    <VoiceProvider>
      <div className="flex h-screen bg-white dark:bg-chat-bg text-gray-900 dark:text-chat-text overflow-hidden font-body">
      {/* Workspace Nav - 72px leftmost rail */}
      <WorkspaceNav
        workspaces={workspaces}
        current={current}
        onSelect={handleSelectWorkspace}
      />

      {/* Sidebar - 240px */}
      <div
        className={clsx(
          'transition-all duration-200 flex-shrink-0 overflow-hidden',
          sidebarOpen ? 'w-60' : 'w-0'
        )}
      >
        {sidebarOpen && <Sidebar />}
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      </div>
    </VoiceProvider>
  );
};
