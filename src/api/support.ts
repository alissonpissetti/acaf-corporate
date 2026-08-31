import { getCorporateToken, clearCorporateSession } from './auth';
import { apiUrl, parseApiError } from './http';

export type SupportCatalog = {
  categories: Array<{ value: string; label: string }>;
  priorities: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
};

export type SupportTicketSummary = {
  id: string;
  code: string;
  subject: string;
  status: string;
  statusLabel: string;
  categoryLabel: string;
  updatedAt: string;
};

export type SupportTicketDetail = SupportTicketSummary & {
  description: string;
  contextLabel: string | null;
  contextUrl: string | null;
  messages: Array<{
    id: string;
    authorName: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
  }>;
};

async function supportFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export function fetchSupportCatalog(apiPrefix: string) {
  return supportFetch<SupportCatalog>(`${apiPrefix}/catalog`);
}

export function fetchSupportTickets(apiPrefix: string) {
  return supportFetch<{ items: SupportTicketSummary[]; total: number }>(`${apiPrefix}/tickets?limit=50`);
}

export function fetchSupportTicket(apiPrefix: string, id: string) {
  return supportFetch<SupportTicketDetail>(`${apiPrefix}/tickets/${id}`);
}

export function createSupportTicket(apiPrefix: string, payload: Record<string, unknown>) {
  return supportFetch<SupportTicketDetail>(`${apiPrefix}/tickets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addSupportTicketMessage(apiPrefix: string, id: string, body: string) {
  return supportFetch<SupportTicketDetail>(`${apiPrefix}/tickets/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
