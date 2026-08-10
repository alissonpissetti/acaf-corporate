import { apiUrl, parseApiError } from './http';

const TOKEN_KEY = 'acaf_corporate_token';
const USER_KEY = 'acaf_corporate_user';
const COMPANY_KEY = 'acaf_corporate_company';

export type CorporateSessionUser = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  roles: string[];
  roleLabels: string[];
};

export type CompanyDto = {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string | null;
  status: 'pending' | 'active' | 'suspended';
  enrollmentCode: string | null;
  createdAt: string;
  updatedAt: string;
  managers?: number;
  employees?: number;
};

export type CorporateLoginResult = {
  accessToken: string;
  user: CorporateSessionUser;
  companyIds: string[];
  company: CompanyDto | null;
};

export type CorporateMeResult = {
  user: CorporateSessionUser;
  companyIds: string[];
  company: CompanyDto;
};

export function getCorporateToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setCorporateSession(
  token: string,
  user: CorporateSessionUser,
  company: CompanyDto | null,
): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (company) {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  }
}

export function getCorporateUser(): CorporateSessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CorporateSessionUser;
  } catch {
    return null;
  }
}

export function getCorporateCompany(): CompanyDto | null {
  const raw = localStorage.getItem(COMPANY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompanyDto;
  } catch {
    return null;
  }
}

export function clearCorporateSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANY_KEY);
}

export async function corporateLogin(login: string, password: string): Promise<CorporateLoginResult> {
  const res = await fetch(apiUrl('/api/corporate/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Usuário ou senha inválidos.'));
  }

  return res.json() as Promise<CorporateLoginResult>;
}

export async function corporateSignup(body: {
  legalName: string;
  tradeName?: string;
  cnpj: string;
  companyEmail: string;
  phone?: string;
  managerName: string;
  managerEmail: string;
  managerCpf: string;
  managerPhone: string;
  password: string;
}): Promise<{ ok: boolean; message: string; company: { id: string } }> {
  const res = await fetch(apiUrl('/api/corporate/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Não foi possível cadastrar a empresa.'));
  }

  return res.json() as Promise<{ ok: boolean; message: string; company: { id: string } }>;
}

export async function corporateMe(): Promise<CorporateMeResult> {
  const token = getCorporateToken();
  if (!token) throw new Error('Sessão expirada.');

  const res = await fetch(apiUrl('/api/corporate/auth/me'), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearCorporateSession();
    throw new Error(await parseApiError(res, 'Sessão expirada.'));
  }

  return res.json() as Promise<CorporateMeResult>;
}
