import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { Mail, Lock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as any)?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Vui lòng nhập email';
    if (!password) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      setAuth(data.user as any, data.accessToken);
      toast.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message || 'Đăng nhập thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1b1b1d] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-gray-900 dark:border-white flex items-center justify-center">
              <Zap size={22} className="text-gray-900 dark:text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Chat Realtime
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Đăng nhập để tiếp tục
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-50 dark:bg-[#2b2d31] rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail size={18} />}
              autoFocus
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock size={18} />}
            />
            <Button type="submit" fullWidth isLoading={loading} size="lg">
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-600 font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
