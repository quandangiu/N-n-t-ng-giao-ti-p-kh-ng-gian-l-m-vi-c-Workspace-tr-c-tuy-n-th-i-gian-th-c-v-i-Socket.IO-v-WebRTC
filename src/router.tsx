import React from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ChannelPage } from './pages/ChannelPage';
import { JoinInvitePage } from './pages/JoinInvitePage';

/* ── Protected Route wrapper ── */
const ProtectedRoute: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
};

/* ── Guest Route wrapper (đã login → redirect về trang trước đó) ── */
const GuestRoute: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const from = (location.state as any)?.from || '/';
  if (user) return <Navigate to={from} replace />;
  return <Outlet />;
};

/* ── Router ── */
export const router = createBrowserRouter([
  // Guest routes
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center space-y-3">
                  <div className="text-5xl">💬</div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Chào mừng đến Chat Realtime
                  </h2>
                  <p>Chọn hoặc tạo workspace để bắt đầu</p>
                </div>
              </div>
            ),
          },
          {
            path: 'workspace/:slug',
            element: <WorkspacePage />,
          },
          {
            path: 'workspace/:slug/channel/:channelId',
            element: <ChannelPage />,
          },
          {
            path: 'workspace/join/:inviteCode',
            element: <JoinInvitePage />,
          },
        ],
      },
    ],
  },
  // Catch all
  { path: '*', element: <Navigate to="/" replace /> },
]);
