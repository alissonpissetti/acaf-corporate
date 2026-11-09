import { normalizeCpf, normalizePhone } from './personInput';

export type ParsedEmployeeRow = {
  name: string;
  email: string;
  mobilePhone: string;
  cpf?: string;
};

export type ParseEmployeesResult =
  | { ok: true; rows: ParsedEmployeeRow[] }
  | { ok: false; error: string };

const MAX_ROWS = 500;

/** Uma linha de CSV/TSV com suporte a aspas duplas (RFC básico). */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function detectDelimiter(line: string): string {
  const semi = (line.match(/;/g) ?? []).length;
  const comma = (line.match(/,/g) ?? []).length;
  return semi >= comma ? ';' : ',';
}

function normalizeHeaderCell(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function mapHeaderIndices(header: string[]): {
  name: number;
  email: number;
  phone: number;
  cpf: number | null;
} | null {
  const h = header.map(normalizeHeaderCell);
  const nameIdx = h.findIndex((c) => /^(nome|name)/.test(c));
  const emailIdx = h.findIndex((c) => /^(e-?mail|email)/.test(c));
  const phoneIdx = h.findIndex((c) =>
    /^(celular|telefone|fone|phone|mobile|whatsapp)/.test(c),
  );
  const cpfIdx = h.findIndex((c) => /^cpf/.test(c));
  if (nameIdx >= 0 && emailIdx >= 0 && phoneIdx >= 0) {
    return { name: nameIdx, email: emailIdx, phone: phoneIdx, cpf: cpfIdx >= 0 ? cpfIdx : null };
  }
  return null;
}

function isProbablyHeaderRow(cells: string[]): boolean {
  const h = cells.map(normalizeHeaderCell);
  const hasName = h.some((c) => /^(nome|name)/.test(c));
  const hasEmail = h.some((c) => /^(e-?mail|email)/.test(c));
  return hasName && hasEmail;
}

/** E-mail simples para validação de linha. */
function isValidEmail(s: string): boolean {
  const v = s.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Parse de texto colado ou arquivo CSV: cabeçalho opcional com colunas nome, e-mail, celular (obrig.) e cpf (opc.).
 * Delimitador `,` ou `;`.
 */
export function parseEmployeesImportText(raw: string): ParseEmployeesResult {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) {
    return { ok: false, error: 'Cole ou importe um arquivo com ao menos uma linha.' };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: 'Nenhuma linha válida encontrada.' };
  }

  const delim = detectDelimiter(lines[0]!);
  const firstCells = splitCsvLine(lines[0]!, delim);
  let headerMap = mapHeaderIndices(firstCells);
  let startLine = 0;

  if (headerMap) {
    startLine = 1;
  } else if (firstCells.length >= 3 && !isProbablyHeaderRow(firstCells)) {
    headerMap =
      firstCells.length >= 4
        ? { name: 0, email: 1, phone: 2, cpf: 3 }
        : { name: 0, email: 1, phone: 2, cpf: null };
  } else {
    return {
      ok: false,
      error:
        'Use colunas com cabeçalho: nome, e-mail, celular e opcionalmente cpf — ou 3–4 colunas nessa ordem (nome; e-mail; celular; cpf opcional).',
    };
  }

  const rows: ParsedEmployeeRow[] = [];
  const seenEmail = new Set<string>();

  for (let i = startLine; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!, delim);
    const name = (cells[headerMap.name] ?? '').trim();
    const email = (cells[headerMap.email] ?? '').trim().toLowerCase();
    const phoneRaw = cells[headerMap.phone] ?? '';
    const cpfRaw =
      headerMap.cpf != null && cells[headerMap.cpf] != null ? cells[headerMap.cpf]!.trim() : '';

    if (!name && !email && !phoneRaw && !cpfRaw) continue;

    if (!name || !email) {
      return {
        ok: false,
        error: `Linha ${i + 1}: informe nome e e-mail em todas as linhas.`,
      };
    }

    if (!isValidEmail(email)) {
      return { ok: false, error: `Linha ${i + 1}: e-mail inválido (${email}).` };
    }

    const mobileDigits = normalizePhone(phoneRaw);
    if (mobileDigits.length !== 11 || mobileDigits[2] !== '9') {
      return {
        ok: false,
        error: `Linha ${i + 1}: celular inválido — use DDD + 9 dígitos (11 números), ex.: 11987654321.`,
      };
    }

    let cpf: string | undefined;
    if (cpfRaw) {
      const cpfDigits = normalizeCpf(cpfRaw);
      if (cpfDigits.length !== 11) {
        return { ok: false, error: `Linha ${i + 1}: CPF com quantidade de dígitos inválida.` };
      }
      cpf = cpfDigits;
    }

    const key = email;
    if (seenEmail.has(key)) {
      return { ok: false, error: `E-mail duplicado na lista: ${email}.` };
    }
    seenEmail.add(key);

    rows.push({
      name,
      email,
      mobilePhone: mobileDigits,
      ...(cpf ? { cpf } : {}),
    });

    if (rows.length > MAX_ROWS) {
      return { ok: false, error: `No máximo ${MAX_ROWS} linhas por importação.` };
    }
  }

  if (rows.length === 0) {
    return { ok: false, error: 'Nenhum colaborador válido após o cabeçalho.' };
  }

  return { ok: true, rows };
}

export function employeesImportCsvTemplate(): string {
  return [
    'nome;e-mail;celular;cpf',
    'Maria Silva;maria@empresa.com.br;11987654321;12345678901',
    'João Santos;joao@empresa.com.br;21999887766',
  ].join('\r\n');
}
