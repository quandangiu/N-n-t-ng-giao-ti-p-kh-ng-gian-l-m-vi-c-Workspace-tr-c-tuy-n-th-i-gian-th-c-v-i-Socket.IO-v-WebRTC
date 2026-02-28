import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const dotSizeMap = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

// Tạo màu từ tên (deterministic)
const getColorFromName = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline,
  className,
}) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx(
            'rounded-full object-cover',
            sizeMap[size]
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-semibold text-white',
            sizeMap[size],
            getColorFromName(name)
          )}
        >
          {initials}
        </div>
      )}

      {/* Online dot */}
      {isOnline !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-gray-100 dark:border-sidebar-dark',
            dotSizeMap[size],
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
};
