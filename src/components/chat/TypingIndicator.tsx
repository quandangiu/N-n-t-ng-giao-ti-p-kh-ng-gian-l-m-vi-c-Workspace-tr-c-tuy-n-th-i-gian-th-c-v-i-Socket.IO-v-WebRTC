import React from 'react';

interface TypingIndicatorProps {
  usernames: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  usernames,
}) => {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} đang nhập...`
      : usernames.length === 2
      ? `${usernames[0]} và ${usernames[1]} đang nhập...`
      : `${usernames[0]} và ${usernames.length - 1} người khác đang nhập...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      {/* Dot animation */}
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{text}</span>
    </div>
  );
};
