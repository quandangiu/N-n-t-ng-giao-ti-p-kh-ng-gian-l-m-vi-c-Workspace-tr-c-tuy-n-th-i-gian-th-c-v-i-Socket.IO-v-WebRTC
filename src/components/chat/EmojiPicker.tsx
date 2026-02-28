import React from 'react';
import { EMOJI_LIST } from '../../utils/constants';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <div className="absolute z-50 -top-12 right-0 bg-white dark:bg-[#2b2d31] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 flex gap-1">
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 text-lg transition-transform hover:scale-125"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
