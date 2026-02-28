import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-1 min-w-[160px] rounded-lg bg-white dark:bg-[#2b2d31] border border-gray-200 dark:border-gray-700 shadow-xl py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
