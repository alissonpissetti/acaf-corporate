import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addEmployee,
  addEmployeesBulk,
  checkInTypeLabel,
  employeeBillingShortLabel,
  employeeStatusLabel,
  formatMonthKey,
  getEmployeeEnrollmentCode,
  getEmployeesUsageReport,
  getEmployeeUsage,
  getEnrollmentCode,
  listEmployees,
  patchEmployee,
  sendEmployeeInviteEmail,
  sendEmployeeInviteSms,
  type EmployeeDto,
  type EmployeesUsageReport,
  type EmployeeUsageResponse,
} from '../api/client';
import { useCorporate } from '../corporateContext';
import { useFlash } from '../flashContext';
import { copyTextToClipboard } from '../utils/clipboard';
import {
  employeesImportCsvTemplate,
  parseEmployeesImportText,
  type ParsedEmployeeRow,
} from '../utils/employeeBulkImport';
import { formatCpfInput, formatPhoneInput } from '../utils/personInput';
import type { EmployeesBulkImportResult } from '../api/client';
import './DashboardPage.css';
import '../components/EmployeeModal.css';

function canSendInvite(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function EmployeesPage() {
  const flash = useFlash();
  const { company } = useCorporate();
  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(
    company?.enrollmentCode ?? null,
  );
  const [codeLoading, setCodeLoading] = useState(company?.status === 'active');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [bulkPreview, setBulkPreview] = useState<ParsedEmployeeRow[] | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<EmployeesBulkImportResult | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<EmployeeUsageResponse | null>(null);

  const [reportMonth, setReportMonth] = useState(currentMonthKey);
  const [reportData, setReportData] = useState<EmployeesUsageReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listEmployees();
      setEmployees(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar colaboradores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadReport = useCallback(async (monthKey: string) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await getEmployeesUsageReport(monthKey);
      setReportData(data);
    } catch (e) {
      setReportData(null);
      setReportError(e instanceof Error ? e.message : 'Erro ao carregar relatório.');
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(reportMonth);
  }, [reportMonth, loadReport]);

  useEffect(() => {
    if (company?.enrollmentCode) {
      setEnrollmentCode(company.enrollmentCode);
      setCodeLoading(false);
      setCodeError(null);
      return;
    }

    if (company?.status !== 'active') {
      setEnrollmentCode(null);
      setCodeLoading(false);
      return;
    }

    setCodeLoading(true);
    setCodeError(null);
    void getEnrollmentCode()
      .then(({ enrollmentCode: code }) => {
        setEnrollmentCode(code);
      })
      .catch((e) => {
        setEnrollmentCode(null);
        setCodeError(e instanceof Error ? e.message : 'Não foi possível obter o código.');
      })
      .finally(() => setCodeLoading(false));
  }, [company?.enrollmentCode, company?.status]);

  useEffect(() => {
    if (!modalOpen && !bulkModalOpen && !profileOpen) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return;
      if (profileOpen && !profileLoading) {
        setProfileOpen(false);
        return;
      }
      if (bulkModalOpen && !bulkBusy) {
        setBulkModalOpen(false);
        return;
      }
      if (modalOpen && !busy) setModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen, bulkModalOpen, profileOpen, busy, bulkBusy, profileLoading]);

  const downloadBulkTemplate = () => {
    const csv = '\uFEFF' + employeesImportCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'colaboradores-modelo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runBulkParse = useCallback((text: string) => {
    const parsed = parseEmployeesImportText(text);
    if (!parsed.ok) {
      setBulkParseError(parsed.error);
      setBulkPreview(null);
      return;
    }
    setBulkParseError(null);
    setBulkPreview(parsed.rows);
    setBulkResult(null);
  }, []);

  const openBulkModal = useCallback(() => {
    setBulkModalOpen(true);
    setBulkResult(null);
    const text = bulkText.trim() ? bulkText : `${employeesImportCsvTemplate()}\n`;
    setBulkText(text);
    runBulkParse(text);
  }, [bulkText, runBulkParse]);

  const onBulkFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const t = typeof reader.result === 'string' ? reader.result : '';
      setBulkText(t);
      runBulkParse(t);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const onBulkImportSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!bulkPreview?.length) {
      flash.error('Revise os dados: nenhuma linha válida para importar.');
      return;
    }
    setBulkBusy(true);
    setBulkResult(null);
    try {
      const res = await addEmployeesBulk(bulkPreview);
      setBulkResult(res);
      const parts = [
        `${res.created} cadastrado(s)`,
        res.skipped > 0 ? `${res.skipped} ignorado(s) (já na empresa)` : null,
        res.failed > 0 ? `${res.failed} com erro de validação` : null,
      ].filter(Boolean);
      flash.success(`Importação concluída: ${parts.join(' · ')}.`);
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro na importação.');
    } finally {
      setBulkBusy(false);
    }
  };

  const openProfile = async (emp: EmployeeDto) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    setProfileData(null);
    try {
      const data = await getEmployeeUsage(emp.id);
      setProfileData(data);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Erro ao carregar uso.');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    if (profileLoading) return;
    setProfileOpen(false);
    setProfileData(null);
    setProfileError(null);
  };

  /** Mantém o painel alinhado à lista após convite ou troca de status. */
  const refreshProfileFromServer = async (employeeId: string) => {
    if (!profileOpen) return;
    try {
      const data = await getEmployeeUsage(employeeId);
      setProfileData(data);
    } catch {
      /* lista já foi atualizada; painel pode fechar manualmente */
    }
  };

  const onCopyCompanyCode = async () => {
    setActionBusyId('company-code');
    try {
      const code =
        enrollmentCode ?? (await getEnrollmentCode()).enrollmentCode;
      await copyTextToClipboard(code);
      flash.success('Código de adesão copiado.');
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao copiar código.');
    } finally {
      setActionBusyId(null);
    }
  };

  const onAdd = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      await addEmployee({
        name,
        email,
        cpf: cpf || undefined,
        mobilePhone,
      });
      flash.success('Colaborador cadastrado. Envie o código de adesão quando quiser.');
      setModalOpen(false);
      setName('');
      setEmail('');
      setCpf('');
      setMobilePhone('');
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao cadastrar.');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (emp: EmployeeDto) => {
    const next = emp.status === 'inactive' ? 'active' : 'inactive';
    if (emp.status === 'invited' || emp.status === 'pending') {
      flash.info('Aguardando o colaborador cadastrar no app com o código da empresa.');
      return;
    }
    try {
      await patchEmployee(emp.id, next);
      flash.success(next === 'active' ? 'Colaborador reativado.' : 'Colaborador inativado.');
      await load();
      await refreshProfileFromServer(emp.id);
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao atualizar.');
    }
  };

  const onSendEmail = async (emp: EmployeeDto) => {
    setActionBusyId(emp.id);
    try {
      await sendEmployeeInviteEmail(emp.id);
      flash.success(
        emp.status === 'pending'
          ? 'Código enviado por e-mail.'
          : 'Código reenviado por e-mail.',
      );
      await load();
      await refreshProfileFromServer(emp.id);
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao enviar e-mail.');
    } finally {
      setActionBusyId(null);
    }
  };

  const onCopyCode = async (emp: EmployeeDto) => {
    setActionBusyId(emp.id);
    try {
      const code =
        enrollmentCode ??
        (await getEmployeeEnrollmentCode(emp.id)).enrollmentCode;
      await copyTextToClipboard(code);
      flash.success('Código de adesão copiado.');
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao copiar código.');
    } finally {
      setActionBusyId(null);
    }
  };

  const onSendSms = async (emp: EmployeeDto) => {
    if (!emp.mobilePhone) {
      flash.error('Colaborador sem celular cadastrado.');
      return;
    }
    setActionBusyId(emp.id);
    try {
      await sendEmployeeInviteSms(emp.id);
      flash.success('Código enviado para o celular.');
      await load();
      await refreshProfileFromServer(emp.id);
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao enviar o código ao celular.');
    } finally {
      setActionBusyId(null);
    }
  };

  const downloadReportCsv = () => {
    if (!reportData) return;
    const mk = reportData.monthKey;
    const header = [
      'Mês',
      'Nome',
      'E-mail',
      'Status',
      'Dias check-in plano (mês)',
      'Dias diárias (mês)',
      'Plano',
      'Perfil no app',
    ];
    const lines = reportData.rows.map((r) => [
      mk,
      r.name.replace(/"/g, '""'),
      r.email.replace(/"/g, '""'),
      employeeStatusLabel(r.status),
      String(r.memberCheckInDaysInMonth),
      String(r.dailyPassVisitDaysInMonth),
      (r.subscriptionPlanName ?? '').replace(/"/g, '""'),
      relationshipLabel(r.relationship),
    ]);
    const csv =
      '\uFEFF' +
      [header.join(';'), ...lines.map((cols) => cols.map((c) => `"${c}"`).join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uso-colaboradores-${mk}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const relationshipLabel = (rel: string) => {
    switch (rel) {
      case 'primary':
        return 'Assinante (academia principal)';
      case 'daily_pass':
        return 'Só diárias';
      case 'mixed':
        return 'Assinante + diárias';
      case 'visitor':
        return 'Sem vínculo ativo no app';
      default:
        return rel;
    }
  };

  const formatDateTimeBr = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const statusBadgeClass = (status: EmployeeDto['status']) => {
    switch (status) {
      case 'active':
        return 'badge badge-active';
      case 'invited':
        return 'badge badge-invited';
      case 'pending':
        return 'badge badge-pending';
      default:
        return 'badge badge-inactive';
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header page-header-row">
        <div>
          <h1>Colaboradores</h1>
          <p className="page-lead">
            Cadastre colaboradores e compartilhe o código de adesão para cadastro no app.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => openBulkModal()}>
            Importar lista
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            Adicionar colaborador
          </button>
        </div>
      </header>

      {company?.status === 'active' ? (
        <section className="panel enrollment-code-panel">
          <div className="panel-body">
            {codeLoading ? (
              <p className="enrollment-code-lead">Carregando código de adesão…</p>
            ) : enrollmentCode ? (
              <div className="enrollment-code-row">
                <div>
                  <h2 className="enrollment-code-title">Código de adesão da empresa</h2>
                  <p className="enrollment-code-lead">
                    O colaborador abre o aplicativo, vai em <strong>Minha conta</strong> e
                    informa este código para vincular a empresa e escolher o plano.
                  </p>
                </div>
                <div className="enrollment-code-value-wrap">
                  <code className="enrollment-code-value">{enrollmentCode}</code>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={actionBusyId === 'company-code'}
                    onClick={() => void onCopyCompanyCode()}
                  >
                    Copiar código
                  </button>
                </div>
              </div>
            ) : (
              <p className="enrollment-code-lead page-error">
                {codeError ?? 'Não foi possível carregar o código. Tente sair e entrar novamente.'}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-body">
            <p className="enrollment-code-lead">
              Sua empresa está com status <strong>{company?.status ?? 'pendente'}</strong>. O código
              de adesão aparece após aprovação no <strong>Painel Admin</strong> (menu Corporativo →
              Empresas → Aprovar empresa).
            </p>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-body">
          <div className="page-header-row" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
            <div>
              <h2 className="enrollment-code-title" style={{ marginBottom: 4 }}>
                Relatório de uso (mensal)
              </h2>
              <p className="enrollment-code-lead" style={{ marginBottom: 0 }}>
                Check-ins de assinantes e diárias por colaborador no mês civil, e visão agregada por plano. Os números são{' '}
                <strong>dias distintos com registro</strong> no app para o mês selecionado.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="field-hint" style={{ display: 'block', marginBottom: 4 }}>
                  Mês de referência
                </span>
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(ev) => setReportMonth(ev.target.value)}
                  disabled={reportLoading}
                />
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={!reportData || reportLoading}
                onClick={() => downloadReportCsv()}
              >
                Exportar CSV
              </button>
            </div>
          </div>

          {reportError ? <p className="page-error">{reportError}</p> : null}
          {reportLoading ? (
            <p className="empty-state">Carregando relatório…</p>
          ) : reportData ? (
            <>
              <p className="muted" style={{ marginBottom: 16, fontSize: '0.9rem' }}>
                <strong>{formatMonthKey(reportData.monthKey)}</strong>
                {' · '}
                {reportData.totals.employees} colaborador(es) · soma dos dias-distintos com check-in de plano (todos):{' '}
                <strong>{reportData.totals.memberCheckInDaysInMonth}</strong>
                {' · '}
                soma dos dias-distintos diárias (todos): <strong>{reportData.totals.dailyPassVisitDaysInMonth}</strong>
              </p>

              {reportData.byPlan.length > 0 ? (
                <>
                  <h3 className="emp-profile-section-title">Uso por plano (colaboradores da empresa)</h3>
                  <div className="table-wrap" style={{ marginBottom: 24 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Plano</th>
                          <th>Colaboradores</th>
                          <th>Soma dias-distintos (check-in plano)</th>
                          <th>Soma dias-distintos diárias</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.byPlan.map((p) => (
                          <tr key={p.subscriptionPlanId ?? 'none'}>
                            <td>{p.subscriptionPlanName}</td>
                            <td>{p.employeeCount}</td>
                            <td>{p.sumMemberCheckInDays}</td>
                            <td>{p.sumDailyPassVisitDays}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              <h3 className="emp-profile-section-title">Por colaborador</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Status</th>
                      <th>Dias (check-in plano)</th>
                      <th>Dias diárias</th>
                      <th>Plano</th>
                      <th>Perfil app</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((r) => (
                      <tr key={r.employeeId}>
                        <td>{r.name}</td>
                        <td>{r.email}</td>
                        <td>
                          <span className={statusBadgeClass(r.status)}>
                            {employeeStatusLabel(r.status)}
                          </span>
                        </td>
                        <td>{r.memberCheckInDaysInMonth}</td>
                        <td>{r.dailyPassVisitDaysInMonth}</td>
                        <td>{r.subscriptionPlanName ?? '—'}</td>
                        <td>{relationshipLabel(r.relationship)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {error && <p className="page-error">{error}</p>}

      <section className="panel">
        <div className="panel-body panel-body-flush">
          {loading ? (
            <p className="empty-state">Carregando…</p>
          ) : employees.length === 0 ? (
            <p className="empty-state">Nenhum colaborador cadastrado.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Celular</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const actionBusy = actionBusyId === emp.id;
                    return (
                      <tr key={emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.mobilePhone ?? '—'}</td>
                        <td>
                          <span className={statusBadgeClass(emp.status)}>
                            {employeeStatusLabel(emp.status)}
                          </span>
                        </td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={actionBusy}
                            onClick={() => void openProfile(emp)}
                          >
                            Perfil
                          </button>
                          {(emp.status === 'active' || emp.status === 'inactive') && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={actionBusy}
                              onClick={() => void toggleStatus(emp)}
                            >
                              {emp.status === 'active' ? 'Inativar' : 'Reativar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {profileOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => void closeProfile()}>
          <div
            className="employee-modal employee-modal--profile"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emp-profile-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <header className="employee-modal-header">
              <div className="employee-modal-header-text">
                <h2 id="emp-profile-title" className="employee-modal-title">
                  Perfil do colaborador
                </h2>
                <p className="employee-modal-lead">
                  Uso no app, fatura do mês e, quando aplicável, envio do código de adesão para cadastro no aplicativo.
                </p>
              </div>
              <button
                type="button"
                className="employee-modal-close"
                aria-label="Fechar"
                disabled={profileLoading}
                onClick={() => void closeProfile()}
              >
                ×
              </button>
            </header>
            <div className="employee-modal-body" style={{ padding: '0 24px 24px' }}>
              {profileLoading ? <p className="page-loading">Carregando…</p> : null}
              {profileError ? <p className="page-error">{profileError}</p> : null}
              {!profileLoading && profileData ? (
                <>
                  <div className="emp-profile-meta">
                    <div>
                      <strong>{profileData.employee.name}</strong>
                    </div>
                    <div>
                      {profileData.employee.email}
                      {profileData.employee.cpf ? ` · CPF ${profileData.employee.cpf}` : ''}
                      {profileData.employee.mobilePhone ? ` · ${profileData.employee.mobilePhone}` : ''}
                    </div>
                    <div>
                      <strong>{employeeStatusLabel(profileData.employee.status)}</strong>
                    </div>
                    {profileData.employee.billing ? (
                      <p className="emp-profile-billing">{employeeBillingShortLabel(profileData.employee)}</p>
                    ) : null}
                  </div>
                  {canSendInvite(profileData.employee) ? (
                    <div className="emp-profile-invite">
                      <h3 className="emp-profile-section-title">Código de adesão</h3>
                      <p className="emp-profile-invite-lead muted">
                        Envia o mesmo código da empresa (visível acima na tela) para o colaborador cadastrar no app em{' '}
                        <strong>Minha conta</strong>, ou copie para enviar por outro canal.
                      </p>
                      <div className="emp-profile-invite-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={actionBusyId === profileData.employee.id}
                          onClick={() => void onSendEmail(profileData.employee)}
                        >
                          Enviar por e-mail
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={actionBusyId === profileData.employee.id}
                          onClick={() => void onCopyCode(profileData.employee)}
                        >
                          Copiar código
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={
                            actionBusyId === profileData.employee.id || !profileData.employee.mobilePhone
                          }
                          title={
                            profileData.employee.mobilePhone
                              ? 'Envia o código por SMS para o celular cadastrado'
                              : 'Cadastre o celular do colaborador para enviar SMS'
                          }
                          onClick={() => void onSendSms(profileData.employee)}
                        >
                          Enviar por SMS
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <h3 className="emp-profile-section-title">Uso no aplicativo</h3>
                  <div className="emp-profile-stats">
                    <div className="emp-profile-stat">
                      <span>Perfil no app</span>
                      {relationshipLabel(profileData.usage.relationship)}
                    </div>
                    <div className="emp-profile-stat">
                      <span>Check-ins (total)</span>
                      {profileData.usage.totalCheckIns}
                    </div>
                    <div className="emp-profile-stat">
                      <span>Check-ins (mês)</span>
                      {profileData.usage.checkInsThisMonth}
                    </div>
                    <div className="emp-profile-stat">
                      <span>Diárias (total)</span>
                      {profileData.usage.dailyPassesTotal}
                    </div>
                    <div className="emp-profile-stat">
                      <span>Última visita</span>
                      {profileData.usage.lastVisit
                        ? formatDateTimeBr(profileData.usage.lastVisit)
                        : '—'}
                    </div>
                  </div>
                  {profileData.usage.primaryHistory?.connectPlanName ? (
                    <p className="muted" style={{ marginBottom: 12, fontSize: '0.875rem' }}>
                      Plano: <strong>{profileData.usage.primaryHistory.connectPlanName}</strong>
                      {profileData.usage.primaryHistory.primaryCheckInsSinceFirst != null
                        ? ` · check-ins desde a troca de academia: ${profileData.usage.primaryHistory.primaryCheckInsSinceFirst}`
                        : ''}
                    </p>
                  ) : null}
                  <h3 className="emp-profile-section-title">Histórico (check-ins e diárias)</h3>
                  {profileData.usage.checkIns.length === 0 ? (
                    <p className="muted" style={{ fontSize: '0.875rem' }}>
                      Nenhum check-in ou diária encontrado ainda com este nome no app.
                    </p>
                  ) : (
                    <div className="table-wrap" style={{ maxHeight: 280, overflow: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileData.usage.checkIns.slice(0, 80).map((row) => (
                            <tr key={row.id}>
                              <td>{formatDateTimeBr(row.validatedAt)}</td>
                              <td>{checkInTypeLabel(row.type)}</td>
                              <td>{row.unitName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {bulkModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !bulkBusy && setBulkModalOpen(false)}
        >
          <div
            className="employee-modal employee-modal--bulk"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-import-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <header className="employee-modal-header">
              <div className="employee-modal-header-text">
                <h2 id="bulk-import-title" className="employee-modal-title">
                  Importar colaboradores
                </h2>
                <p className="employee-modal-lead" style={{ maxWidth: 'none' }}>
                  Cole dados do Excel (colunas{' '}
                  <strong>nome</strong>, <strong>e-mail</strong>, <strong>celular</strong>, opcional{' '}
                  <strong>cpf</strong>) ou envie um CSV. Delimitador <strong>;</strong> ou <strong>,</strong>.
                </p>
              </div>
              <button
                type="button"
                className="employee-modal-close"
                aria-label="Fechar"
                disabled={bulkBusy}
                onClick={() => setBulkModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form className="employee-modal-form" onSubmit={(ev) => void onBulkImportSubmit(ev)}>
              <div className="employee-modal-body">
                <div className="employee-bulk-toolbar">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={bulkBusy}
                    onClick={() => void downloadBulkTemplate()}
                  >
                    Baixar modelo CSV
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={bulkBusy}
                    onClick={() => bulkFileRef.current?.click()}
                  >
                    Escolher arquivo…
                  </button>
                  <input
                    ref={bulkFileRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="employee-bulk-file-input"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onBulkFileChange}
                  />
                </div>

                <div className="field field-span-2" style={{ marginBottom: 0 }}>
                  <label htmlFor="bulk-paste">Dados (cole ou edite)</label>
                  <textarea
                    id="bulk-paste"
                    className="employee-bulk-textarea"
                    value={bulkText}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      setBulkText(v);
                      runBulkParse(v);
                    }}
                    disabled={bulkBusy}
                    spellCheck={false}
                    placeholder={'nome;e-mail;celular;cpf\nMaria Silva;maria@empresa.com.br;11987654321'}
                  />
                  {bulkParseError ? (
                    <p className="page-error" style={{ margin: '8px 0 0' }}>
                      {bulkParseError}
                    </p>
                  ) : null}
                  {bulkPreview ? (
                    <p className="employee-bulk-summary">
                      <strong>{bulkPreview.length}</strong> colaborador(es) reconhecido(s). Linhas duplicadas na
                      base aparecem como “ignoradas” após importar.
                    </p>
                  ) : null}
                  {bulkResult ? (
                    <div style={{ marginTop: 12 }}>
                      <p className="employee-bulk-summary">
                        Resultado: <strong>{bulkResult.created}</strong> novo(s),{' '}
                        <strong>{bulkResult.skipped}</strong> ignorado(s),{' '}
                        <strong>{bulkResult.failed}</strong> com erro.
                      </p>
                      {bulkResult.details.length > 0 ? (
                        <pre className="employee-bulk-details">
                          {bulkResult.details.map((d) => {
                            const msg = d.message ? ` — ${d.message}` : '';
                            return `Linha ${d.index} (${d.outcome})${d.email ? ` ${d.email}` : ''}${msg}\n`;
                          })}
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <p className="employee-modal-note">
                  Celular com DDD e 9 na frente (11 dígitos). O cadastro no app continua sendo feito pelo
                  colaborador com o <strong>código de adesão</strong> da empresa.
                </p>
              </div>

              <footer className="employee-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBulkModalOpen(false)}
                  disabled={bulkBusy}
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bulkBusy || !bulkPreview?.length || !!bulkParseError}
                >
                  {bulkBusy ? 'Importando…' : 'Importar agora'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !busy && setModalOpen(false)}
        >
          <div
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <header className="employee-modal-header">
              <div className="employee-modal-header-text">
                <h2 id="employee-modal-title" className="employee-modal-title">
                  Novo colaborador
                </h2>
                <p className="employee-modal-lead">
                  Cadastre os dados de contato. Depois compartilhe o código de adesão da empresa
                  por e-mail, celular ou copiando manualmente.
                </p>
              </div>
              <button
                type="button"
                className="employee-modal-close"
                aria-label="Fechar"
                disabled={busy}
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form className="employee-modal-form" onSubmit={(ev) => void onAdd(ev)} autoComplete="off">
              <div className="employee-modal-body">
                <div className="employee-modal-grid">
                  <div className="field field-span-2">
                    <label htmlFor="emp-name">Nome completo</label>
                    <input
                      id="emp-name"
                      name="employee-name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      autoComplete="off"
                      placeholder="Ex.: Maria Silva"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field field-span-2">
                    <label htmlFor="emp-email">E-mail</label>
                    <input
                      id="emp-email"
                      name="employee-email"
                      type="email"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      autoComplete="off"
                      placeholder="nome@empresa.com.br"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="emp-phone">Celular</label>
                    <input
                      id="emp-phone"
                      name="employee-phone"
                      value={mobilePhone}
                      onChange={(ev) => setMobilePhone(formatPhoneInput(ev.target.value))}
                      inputMode="tel"
                      autoComplete="off"
                      placeholder="(00) 00000-0000"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="emp-cpf">CPF</label>
                    <input
                      id="emp-cpf"
                      name="employee-cpf"
                      value={cpf}
                      onChange={(ev) => setCpf(formatCpfInput(ev.target.value))}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      disabled={busy}
                    />
                    <p className="field-hint">Opcional no cadastro.</p>
                  </div>
                </div>

                <p className="employee-modal-note">
                  O cadastro no app é feito pelo colaborador com o <strong>código de adesão</strong>{' '}
                  da empresa (Minha conta no aplicativo).
                </p>
              </div>

              <footer className="employee-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Salvando…' : 'Cadastrar colaborador'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
