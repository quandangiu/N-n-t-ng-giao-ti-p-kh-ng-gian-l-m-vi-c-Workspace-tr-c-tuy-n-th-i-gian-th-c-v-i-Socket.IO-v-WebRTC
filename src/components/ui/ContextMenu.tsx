import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface ContextMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    /** Nếu true → hiện separator trước item này */
    separator?: boolean;
    /** Nếu true → ẩn item */
    hidden?: boolean;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    children: React.ReactNode;
    /** Disabled context menu */
    disabled?: boolean;
}

interface MenuPosition {
    x: number;
    y: number;
}

/**
 * Discord-style right-click context menu.
 * Wrap any element — right-click to show menu.
 *
 * Usage:
 * ```tsx
 * <ContextMenu items={[{ label: 'Edit', onClick: handleEdit }]}>
 *   <div>Right-click me</div>
 * </ContextMenu>
 * ```
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ items, children, disabled }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();

        // Tính toán vị trí để menu không bị tràn màn hình
        const menuWidth = 220;
        const menuHeight = items.filter((i) => !i.hidden).length * 36 + 16;

        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;
        if (x < 8) x = 8;
        if (y < 8) y = 8;

        setPosition({ x, y });
        setVisible(true);
    };

    // Đóng khi click outside hoặc scroll
    useEffect(() => {
        if (!visible) return;

        const close = () => setVisible(false);
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };

        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', handleKey);
        document.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);

        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [visible]);

    const visibleItems = items.filter((i) => !i.hidden);

    return (
        <>
            <div onContextMenu={handleContextMenu}>{children}</div>

            {visible && (
                <div
                    ref={menuRef}
                    className="fixed z-[100] min-w-[200px] max-w-[280px] rounded-lg bg-[#111214] border border-gray-800 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: position.x, top: position.y }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {visibleItems.map((item, i) => (
                        <React.Fragment key={i}>
                            {item.separator && i > 0 && (
                                <div className="my-1 mx-2 border-t border-gray-700/50" />
                            )}
                            <button
                                onClick={() => {
                                    item.onClick();
                                    setVisible(false);
                                }}
                                className={clsx(
                                    'w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] rounded-sm mx-0.5 transition-colors',
                                    'focus:outline-none',
                                    item.danger
                                        ? 'text-red-400 hover:bg-red-500 hover:text-white'
                                        : 'text-gray-200 hover:bg-primary hover:text-white'
                                )}
                                style={{ width: 'calc(100% - 4px)' }}
                            >
                                {item.icon && <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                                <span className="truncate">{item.label}</span>
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </>
    );
};
