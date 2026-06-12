import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "yyyy년 M월 d일", { locale: ko });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "yyyy.MM.dd HH:mm", { locale: ko });
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// [3NF 수정] isActive 컬럼 제거 후 두 필드로 직접 판단
// DB 쿼리 조건: WHERE is_manually_expired = false AND (expires_at IS NULL OR expires_at > now())
export function isLinkExpired(
  expiresAt: Date | null,
  isManuallyExpired: boolean
): boolean {
  if (isManuallyExpired) return true;
  if (expiresAt && new Date() > new Date(expiresAt)) return true;
  return false;
}
