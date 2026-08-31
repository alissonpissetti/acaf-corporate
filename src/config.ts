/**
 * URL base da API (sem barra final).
 * Produção Coolify: vazio usa proxy nginx (/api); ou api-config.js se CONNECT_API_DIRECT=1.
 * Dev: VITE_API_URL ou proxy Vite (/api).
 */
export function readApiUrl(): string {
  if (typeof window !== 'undefined' && window.__CONNECT_API_URL__) {
    return String(window.__CONNECT_API_URL__).replace(/\/$/, '');
  }
  const fromEnv = import.meta.env.VITE_API_URL ?? '';
  return String(fromEnv).replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const base = readApiUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
