import { format, isToday, isYesterday } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'HH:mm');
}

export function formatConversationTime(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return '昨日';
  }
  return format(date, 'M/d', { locale: ja });
}

export function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return '今日';
  }
  if (isYesterday(date)) {
    return '昨日';
  }
  return format(date, 'yyyy年M月d日', { locale: ja });
}
