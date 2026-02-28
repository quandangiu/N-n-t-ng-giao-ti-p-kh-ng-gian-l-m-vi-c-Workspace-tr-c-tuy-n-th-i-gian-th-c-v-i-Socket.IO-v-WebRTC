import React from 'react';
import type { ReadByEntry } from '../../types/message.types';

interface ReadReceiptProps {
  readBy: ReadByEntry[];
}

export const ReadReceipt: React.FC<ReadReceiptProps> = ({ readBy }) => {
  if (readBy.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[10px] text-gray-500 dark:text-gray-400">
        👁 Đã xem bởi {readBy.length} người
      </span>
    </div>
  );
};
