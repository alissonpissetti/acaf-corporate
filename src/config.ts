/** Base da API NestJS (acaf-api). Em dev, vazio usa o proxy do Vite. */
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '' : 'http://127.0.0.1:8787');
