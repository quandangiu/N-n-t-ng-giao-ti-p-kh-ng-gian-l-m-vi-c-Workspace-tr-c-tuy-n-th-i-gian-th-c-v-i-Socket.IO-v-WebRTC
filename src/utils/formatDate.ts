import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatMessageTime = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return `Hôm qua ${format(date, 'HH:mm')}`;
  }
  return format(date, 'dd/MM/yyyy HH:mm');
};

export const formatRelativeTime = (dateStr: string): string => {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: vi });
};

export const formatDateSeparator = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hôm nay';
  if (isYesterday(date)) return 'Hôm qua';
  return format(date, 'dd MMMM, yyyy', { locale: vi });
};
