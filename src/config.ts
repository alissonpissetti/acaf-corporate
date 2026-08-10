/**
 * URL base da API (sem barra final).
 * Produção Coolify: definida em runtime via api-config.js (API_BACKEND_URL).
 * Dev: VITE_API_URL ou proxy Vite (/api).
 */
function readApiUrl(): string {
  if (typeof window !== 'undefined' && window.__ACAF_API_URL__) {
    return String(window.__ACAF_API_URL__).replace(/\/$/, '');
  }
  const fromEnv = import.meta.env.VITE_API_URL ?? '';
  return String(fromEnv).replace(/\/$/, '');
}

export const API_URL = readApiUrl();
