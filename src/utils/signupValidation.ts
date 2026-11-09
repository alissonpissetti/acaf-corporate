import { normalizeCnpj, normalizeCpf, normalizePhone } from './personInput';

export function isValidCpf(value: string): boolean {
  const d = normalizeCpf(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function isValidCnpj(value: string): boolean {
  const d = normalizeCnpj(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const d = normalizePhone(value);
  return d.length === 10 || d.length === 11;
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string };

export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 6) return { score: 0, label: 'Muito curta' };
  const labels = ['Fraca', 'Razoável', 'Boa', 'Forte'] as const;
  return { score: score as 0 | 1 | 2 | 3, label: labels[score] };
}
