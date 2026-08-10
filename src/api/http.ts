import { API_URL } from '../config';

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const err = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(err.message)) return err.message.join(', ');
    if (typeof err.message === 'string' && err.message.trim()) return err.message;
  } catch {
    /* ignore */
  }
  return fallback;
}
