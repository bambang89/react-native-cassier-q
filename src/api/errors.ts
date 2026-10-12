import axios from 'axios';

/**
 * Pesan error yang bisa ditampilkan ke user: pesan dari backend
 * (ErrorResponse.message, sudah berbahasa Indonesia) kalau ada, selain itu
 * `fallback`. Timeout/jaringan putus diberi pesan sendiri.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.length > 0) return message;
    if (!error.response) return 'Koneksi ke server bermasalah. Periksa internet lalu coba lagi.';
  }
  return fallback;
}

/** Id acak untuk header Idempotency-Key (cukup unik per percobaan checkout). */
export function newIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}
