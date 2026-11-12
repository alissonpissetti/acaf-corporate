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
  enrollmentCode?: string;
  billing?: {
    monthKey: string;
    includedInMonthlyInvoice: boolean;
    invoiceStatus: 'open' | 'paid' | null;
  };
};

export type PartnerClientCheckInRow = {
  id: string;
  unitId: string;
  unitName: string;
  type: 'daily_pass' | 'connect_member' | string;
  validatedAt: string;
  code: string;
};

export type EmployeesUsageReport = {
  monthKey: string;
  company: { id: string; tradeName: string; legalName: string };
  totals: {
    employees: number;
    memberCheckInDaysInMonth: number;
    dailyPassVisitDaysInMonth: number;
  };
  rows: Array<{
    employeeId: string;
    name: string;
    email: string;
    status: EmployeeDto['status'];
    memberCheckInDaysInMonth: number;
    dailyPassVisitDaysInMonth: number;
    subscriptionPlanId?: string;
    subscriptionPlanName?: string;
    relationship: string;
  }>;
  byPlan: Array<{
    subscriptionPlanId: string | null;
    subscriptionPlanName: string;
    employeeCount: number;
    sumMemberCheckInDays: number;
    sumDailyPassVisitDays: number;
  }>;
};

export type EmployeeUsageResponse = {
  employee: EmployeeDto;
  company: { id: string; tradeName: string; legalName: string };
  usage: {
    holderKey: string;
    name: string;
    relationship: string;
    totalCheckIns: number;
    checkInsThisMonth: number;
    dailyPassesTotal: number;
    dailyPassesThisMonth: number;
    lastVisit?: string;
    companyName?: string;
    checkIns: PartnerClientCheckInRow[];
    studentRecords: Array<{
      id: string;
      unitId: string;
      channel: string;
      checkInsThisMonth: number;
      dailyPassesThisMonth: number;
      lastVisit: string;
    }>;
    primaryHistory: {
      connectPlanName?: string;
      primaryCheckInsSinceFirst?: number;
      changes: Array<{ changedAt: string; toUnitName: string | null; fromUnitName: string | null }>;
    };
  };
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
  enrollmentCode?: string;
  useApp?: boolean;
  message?: string;
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
    enrollmentCode: data.enrollmentCode,
    useApp: data.useApp,
    message: data.message,
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
  const candidates: string[] = [];
  const primary = apiUrl('/api/health');
  candidates.push(primary);
  if (primary.startsWith('/')) {
    candidates.push('/api/health');
  }

  const devFallback = import.meta.env.VITE_API_PROXY_TARGET?.replace(/\/$/, '');
  if (devFallback) {
    candidates.push(`${devFallback}/api/health`);
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) return true;
    } catch {
      /* tenta próximo */
    }
  }
  return false;
}

export function listEmployees(): Promise<EmployeeDto[]> {
  return corporateFetch('/api/corporate/employees');
}

export function getEmployeesUsageReport(monthKey: string): Promise<EmployeesUsageReport> {
  const q = new URLSearchParams({ monthKey });
  return corporateFetch(`/api/corporate/employees/usage-report?${q.toString()}`);
}

export function getEmployeeUsage(id: string): Promise<EmployeeUsageResponse> {
  return corporateFetch(`/api/corporate/employees/${encodeURIComponent(id)}/usage`);
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

export type EmployeesBulkImportResult = {
  created: number;
  skipped: number;
  failed: number;
  details: Array<{
    index: number;
    email?: string;
    outcome: 'created' | 'skipped' | 'error';
    message?: string;
  }>;
};

export function addEmployeesBulk(
  employees: Array<{ name: string; email: string; cpf?: string; mobilePhone: string }>,
): Promise<EmployeesBulkImportResult> {
  return corporateFetch('/api/corporate/employees/bulk', {
    method: 'POST',
    body: JSON.stringify({ employees }),
  });
}

export function patchEmployee(id: string, status: 'active' | 'inactive'): Promise<EmployeeDto> {
  return corporateFetch(`/api/corporate/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function removeEmployee(id: string): Promise<{ ok: true }> {
  return corporateFetch(`/api/corporate/employees/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function resendInvite(id: string): Promise<EmployeeDto> {
  return corporateFetch(`/api/corporate/employees/${id}/resend-invite`, {
    method: 'POST',
  });
}

export type OnboardingShare = {
  enrollmentCode: string;
  webOnboardingUrl: string | null;
  appDownloadUrl: string | null;
  shareText: string;
};

/** URL pública com passo a passo (usa CORPORATE_APP_URL na API ou a origem atual no dev). */
export function resolveWebOnboardingUrl(share: OnboardingShare): string {
  if (share.webOnboardingUrl?.trim()) return share.webOnboardingUrl.trim();
  const url = new URL(`${window.location.origin}/ativar`);
  url.searchParams.set('code', share.enrollmentCode);
  return url.toString();
}

/** Texto completo para colar no WhatsApp, e-mail etc. */
export function onboardingClipboardText(share: OnboardingShare): string {
  const web = resolveWebOnboardingUrl(share);
  if (share.shareText.includes('Instruções no link:')) return share.shareText;
  return `${share.shareText}\n\nInstruções no link: ${web}`;
}

export function getEnrollmentCode(): Promise<OnboardingShare> {
  return corporateFetch('/api/corporate/enrollment-code');
}

export function getEmployeeOnboardingShare(id: string): Promise<OnboardingShare> {
  return corporateFetch(`/api/corporate/employees/${id}/invite-link`);
}

/** @deprecated use getEmployeeOnboardingShare */
export function getEmployeeEnrollmentCode(id: string): Promise<OnboardingShare> {
  return getEmployeeOnboardingShare(id);
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

/** Linha secundária: fatura do mês (apenas colaboradores ativos entram no valor da fatura). */
export function employeeBillingShortLabel(emp: EmployeeDto): string | null {
  const b = emp.billing;
  if (!b) return null;
  if (emp.status !== 'active') {
    return `Fatura ${b.monthKey}: não cobrado (inativo ou ainda sem benefício ativo)`;
  }
  if (b.invoiceStatus === 'paid') {
    return `Fatura ${b.monthKey}: paga`;
  }
  if (b.invoiceStatus === 'open') {
    return `Fatura ${b.monthKey}: em aberto (incluído no valor por colaborador ativo)`;
  }
  return `Fatura ${b.monthKey}: —`;
}

export function checkInTypeLabel(type: string): string {
  if (type === 'daily_pass') return 'Diária';
  if (type === 'connect_member') return 'Check-in (plano)';
  return type;
}
