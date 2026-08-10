import { getCorporateToken, clearCorporateSession } from './auth';
import { apiUrl, parseApiError } from './http';

export type EmployeeDto = {
  id: string;
  userId: string;
  name: string;
  email: string;
  cpf: string | null;
  mobilePhone: string | null;
  status: 'pending' | 'invited' | 'active' | 'inactive';
  invitedAt: string | null;
  activatedAt: string | null;
  inviteUrl?: string;
};

export type InvoiceDto = {
  id: string;
  monthKey: string;
  activeEmployees: number;
  unitAmount: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
};

export type InvitePreview = {
  companyName: string;
  email: string;
  expiresAt: string;
  suggestions?: {
    name?: string;
    cpf?: string;
    mobilePhone?: string;
  };
};

type InvitePreviewResponse = InvitePreview & {
  /** Formato legado da API — nome do colaborador no cadastro da empresa. */
  employeeName?: string;
};

function normalizeInvitePreview(data: InvitePreviewResponse): InvitePreview {
  const legacyName = data.employeeName?.trim();
  const suggestedName = data.suggestions?.name?.trim() || legacyName || undefined;

  return {
    companyName: data.companyName,
    email: data.email,
    expiresAt: data.expiresAt ?? '',
    suggestions: {
      name: suggestedName,
      cpf: data.suggestions?.cpf,
      mobilePhone: data.suggestions?.mobilePhone,
    },
  };
}

async function corporateFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getCorporateToken();
  if (!token) throw new Error('Sessão expirada.');

  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    clearCorporateSession();
    throw new Error('Sessão expirada.');
  }

  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Erro na requisição.'));
  }

  return res.json() as Promise<T>;
}

export async function apiHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'));
    return res.ok;
  } catch {
    return false;
  }
}

export function listEmployees(): Promise<EmployeeDto[]> {
  return corporateFetch('/api/corporate/employees');
}

export function addEmployee(body: {
  name: string;
  email: string;
  cpf?: string;
  mobilePhone: string;
}): Promise<EmployeeDto> {
  return corporateFetch('/api/corporate/employees', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patchEmployee(id: string, status: 'active' | 'inactive'): Promise<EmployeeDto> {
  return corporateFetch(`/api/corporate/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function resendInvite(id: string): Promise<EmployeeDto> {
  return corporateFetch(`/api/corporate/employees/${id}/resend-invite`, {
    method: 'POST',
  });
}

export function getEmployeeInviteLink(id: string): Promise<{ inviteUrl: string }> {
  return corporateFetch(`/api/corporate/employees/${id}/invite-link`);
}

export function sendEmployeeInviteEmail(id: string): Promise<EmployeeDto> {
  return corporateFetch(`/api/corporate/employees/${id}/send-invite-email`, {
    method: 'POST',
  });
}

export function sendEmployeeInviteSms(id: string): Promise<EmployeeDto> {
  return corporateFetch(`/api/corporate/employees/${id}/send-invite-sms`, {
    method: 'POST',
  });
}

export function listInvoices(): Promise<InvoiceDto[]> {
  return corporateFetch('/api/corporate/invoices');
}

export function getInvoice(monthKey: string): Promise<InvoiceDto> {
  return corporateFetch(`/api/corporate/invoices/${encodeURIComponent(monthKey)}`);
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const res = await fetch(apiUrl(`/api/corporate/invites/${encodeURIComponent(token)}`));
  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Convite inválido ou expirado.'));
  }
  const data = (await res.json()) as InvitePreviewResponse;
  return normalizeInvitePreview(data);
}

export async function acceptInvite(
  token: string,
  body: { password: string; cpf: string; name?: string },
): Promise<{ message: string }> {
  const res = await fetch(apiUrl(`/api/corporate/invites/${encodeURIComponent(token)}/accept`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Não foi possível ativar o convite.'));
  }
  return res.json() as Promise<{ message: string }>;
}

export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function employeeStatusLabel(status: EmployeeDto['status']): string {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'pending':
      return 'Cadastrado';
    case 'invited':
      return 'Convite enviado';
    case 'inactive':
      return 'Inativo';
    default:
      return status;
  }
}
