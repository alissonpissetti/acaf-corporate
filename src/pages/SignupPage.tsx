import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { MOVLY_DISPLAY_NAME } from '../brand/displayName';
import { corporateSignup } from '../api/auth';
import { apiHealth } from '../api/client';
import { useCorporate } from '../corporateContext';
import { formatCnpjInput, formatCpfInput, formatPhoneInput } from '../utils/personInput';
import {
  clearSignupDraft,
  loadSignupDraft,
  saveSignupDraft,
  type SignupDraft,
} from '../utils/signupDraft';
import {
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  passwordStrength,
} from '../utils/signupValidation';
import './LoginPage.css';
import './SignupPage.css';
import { PasswordInput } from '../components/PasswordInput';

type FieldKey = keyof SignupDraft | 'passwordConfirm';
type Errors = Partial<Record<FieldKey, string>>;

const STEPS = [
  { id: 'company', title: 'Empresa', hint: 'Dados que aparecem na fatura' },
  { id: 'manager', title: 'Responsável', hint: 'Quem vai gerir o benefício' },
] as const;

const COMPANY_FIELDS: FieldKey[] = ['legalName', 'tradeName', 'cnpj', 'companyEmail', 'phone'];
const MANAGER_FIELDS: FieldKey[] = ['managerName', 'managerEmail', 'managerCpf', 'managerPhone', 'password', 'passwordConfirm'];

function validate(form: SignupDraft, confirm: string, keys: FieldKey[]): Errors {
  const e: Errors = {};
  for (const k of keys) {
    switch (k) {
      case 'legalName':
        if (form.legalName.trim().length < 3) e.legalName = 'Informe a razão social como está no CNPJ.';
        break;
      case 'cnpj':
        if (!isValidCnpj(form.cnpj)) e.cnpj = 'CNPJ inválido. Confira os 14 dígitos.';
        break;
      case 'companyEmail':
        if (!isValidEmail(form.companyEmail)) e.companyEmail = 'Informe um e-mail válido, como financeiro@empresa.com.br.';
        break;
      case 'phone':
        if (form.phone && !isValidPhone(form.phone)) e.phone = 'Telefone incompleto. Use DDD + número.';
        break;
      case 'managerName':
        if (form.managerName.trim().split(/\s+/).length < 2) e.managerName = 'Informe nome e sobrenome.';
        break;
      case 'managerEmail':
        if (!isValidEmail(form.managerEmail)) e.managerEmail = 'Esse e-mail será seu login. Confira o formato.';
        break;
      case 'managerCpf':
        if (!isValidCpf(form.managerCpf)) e.managerCpf = 'CPF inválido. Confira os 11 dígitos.';
        break;
      case 'managerPhone':
        if (!isValidPhone(form.managerPhone)) e.managerPhone = 'Celular incompleto. Use DDD + número.';
        break;
      case 'password':
        if (form.password.length < 8) e.password = 'Use pelo menos 8 caracteres.';
        break;
      case 'passwordConfirm':
        if (confirm !== form.password) e.passwordConfirm = 'As senhas não conferem.';
        break;
      default:
        break;
    }
  }
  return e;
}

type InputProps = {
  id: FieldKey;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  touched?: boolean;
  onBlur: () => void;
  hint?: string;
  optional?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  password?: boolean;
  className?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  touched,
  onBlur,
  hint,
  optional,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  disabled,
  password,
  className,
}: InputProps) {
  const showError = Boolean(touched && error);
  const describedBy = showError ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`su-field${showError ? ' has-error' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="su-optional">opcional</span> : null}
      </label>
      <div className="su-input-wrap">
        {password ? (
          <PasswordInput
            id={id}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            minLength={id === 'password' || id === 'passwordConfirm' ? 8 : undefined}
            aria-invalid={showError}
            aria-describedby={describedBy}
            className="su-password-input"
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(ev) => onChange(ev.target.value)}
            onBlur={onBlur}
            inputMode={inputMode}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            aria-invalid={showError}
            aria-describedby={describedBy}
          />
        )}
      </div>
      {showError ? (
        <p id={`${id}-error`} className="su-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="su-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SignupPage() {
  const { loggedIn } = useCorporate();
  const [form, setForm] = useState<SignupDraft>(loadSignupDraft);
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void apiHealth().then(setApiOnline);
  }, []);

  useEffect(() => {
    saveSignupDraft(form);
  }, [form]);

  const errors = useMemo(
    () => validate(form, confirm, [...COMPANY_FIELDS, ...MANAGER_FIELDS]),
    [form, confirm],
  );
  const strength = passwordStrength(form.password);

  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  const setField = <K extends keyof SignupDraft>(key: K, value: SignupDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const touch = (key: FieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  const stepHasErrors = (fields: FieldKey[]) => fields.some((f) => errors[f]);

  const focusFirstError = (fields: FieldKey[]) => {
    const first = fields.find((f) => errors[f]);
    if (first) document.getElementById(first)?.focus();
  };

  const goNext = () => {
    setTouched((t) => ({ ...t, ...Object.fromEntries(COMPANY_FIELDS.map((f) => [f, true])) }));
    if (stepHasErrors(COMPANY_FIELDS)) {
      focusFirstError(COMPANY_FIELDS);
      return;
    }
    // Se informou telefone da empresa e ainda não há celular do responsável, reaproveita o mesmo número.
    setForm((prev) => {
      const companyPhone = prev.phone.trim();
      if (!companyPhone || prev.managerPhone.trim()) return prev;
      return { ...prev, managerPhone: formatPhoneInput(companyPhone) };
    });
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);

    if (step === 0) {
      goNext();
      return;
    }

    setTouched((t) => ({ ...t, ...Object.fromEntries(MANAGER_FIELDS.map((f) => [f, true])) }));
    if (stepHasErrors(COMPANY_FIELDS)) {
      setStep(0);
      return;
    }
    if (stepHasErrors(MANAGER_FIELDS)) {
      focusFirstError(MANAGER_FIELDS);
      return;
    }
    if (apiOnline === false) {
      setFormError('Não conseguimos falar com o servidor agora. Tente de novo em alguns minutos.');
      return;
    }

    setBusy(true);
    try {
      const result = await corporateSignup({
        legalName: form.legalName.trim(),
        tradeName: form.tradeName.trim() || form.legalName.trim(),
        cnpj: form.cnpj,
        companyEmail: form.companyEmail.trim(),
        phone: form.phone || undefined,
        managerName: form.managerName.trim(),
        managerEmail: form.managerEmail.trim(),
        managerCpf: form.managerCpf,
        managerPhone: form.managerPhone,
        password: form.password,
      });
      clearSignupDraft();
      setSuccess(result.message);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setBusy(false);
    }
  };

  const companyName = form.tradeName.trim() || form.legalName.trim();

  return (
    <div className="login-shell corp-auth su-shell">
      <aside className="corp-auth-brand su-brand movly-grain">
        <BrandLogo height={40} variant="lime" className="su-brand-logo" />

        <div className="su-brand-copy">
          <h2 className="su-brand-title">Bem-estar para sua equipe, sem burocracia.</h2>
          <p className="su-brand-text">
            Em poucos minutos sua empresa oferece academias, estúdios e aulas da rede {MOVLY_DISPLAY_NAME} como
            benefício.
          </p>
        </div>

        <ol className="su-journey" aria-label="Como funciona">
          <li className={step === 0 && !success ? 'is-current' : 'is-done'}>
            <strong>Cadastre a empresa</strong>
            <span>Dados da empresa e do responsável pelo RH.</span>
          </li>
          <li className={success ? 'is-current' : ''}>
            <strong>Aprovação da {MOVLY_DISPLAY_NAME}</strong>
            <span>Validamos o cadastro e avisamos por e-mail.</span>
          </li>
          <li>
            <strong>Convide os colaboradores</strong>
            <span>Cada um ativa o benefício pelo app.</span>
          </li>
        </ol>

        <p className="su-brand-foot">bem-estar para empresas e colaboradores</p>
      </aside>

      <main className="su-main">
        <div className="su-card">
          <div className="su-top">
            <BrandLogo height={26} variant="purple" />
            <p className="su-top-link">
              Já tem cadastro? <Link to="/login">Entrar</Link>
            </p>
          </div>

          {success ? (
            <section className="su-success" aria-live="polite">
              <span className="su-success-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h1 className="su-title">Cadastro enviado</h1>
              <p className="su-lead">{success}</p>
              <ul className="su-next">
                <li>Vamos revisar os dados de {companyName || 'sua empresa'}.</li>
                <li>
                  Você recebe a confirmação em <strong>{form.managerEmail || 'seu e-mail'}</strong>.
                </li>
                <li>Depois disso, é só entrar e convidar os colaboradores.</li>
              </ul>
              <Link to="/login" className="btn btn-primary su-primary">
                Ir para o login
              </Link>
            </section>
          ) : (
            <>
              <h1 className="su-title">Cadastrar empresa</h1>
              <p className="su-lead">Leva cerca de 2 minutos. Seu progresso fica salvo neste navegador.</p>

              <ol className="su-steps" aria-label="Etapas do cadastro">
                {STEPS.map((s, i) => (
                  <li
                    key={s.id}
                    className={`su-step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
                    aria-current={i === step ? 'step' : undefined}
                  >
                    <button
                      type="button"
                      className="su-step-btn"
                      onClick={() => (i < step ? setStep(i) : i === 1 ? goNext() : undefined)}
                      disabled={busy}
                    >
                      <span className="su-step-num">
                        {i < step ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="su-step-text">
                        <strong>{s.title}</strong>
                        <span>{s.hint}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              {apiOnline === false ? (
                <p className="su-banner" role="alert">
                  O servidor não está respondendo. Você pode preencher; o envio fica disponível quando a conexão voltar.
                </p>
              ) : null}

              <form className="su-form" onSubmit={(ev) => void onSubmit(ev)} noValidate>
                {step === 0 ? (
                  <section className="su-section" aria-labelledby="su-company">
                    <h2 id="su-company" className="su-section-title">
                      Dados da empresa
                    </h2>
                    <div className="su-grid">
                      <Field
                        id="legalName"
                        label="Razão social"
                        value={form.legalName}
                        onChange={(v) => setField('legalName', v)}
                        onBlur={() => touch('legalName')}
                        touched={touched.legalName}
                        error={errors.legalName}
                        autoComplete="organization"
                        disabled={busy}
                        className="su-span-2"
                      />
                      <Field
                        id="tradeName"
                        label="Nome fantasia"
                        optional
                        value={form.tradeName}
                        onChange={(v) => setField('tradeName', v)}
                        onBlur={() => touch('tradeName')}
                        hint="Como sua empresa aparece para os colaboradores."
                        disabled={busy}
                        className="su-span-2"
                      />
                      <Field
                        id="cnpj"
                        label="CNPJ"
                        value={form.cnpj}
                        onChange={(v) => setField('cnpj', formatCnpjInput(v))}
                        onBlur={() => touch('cnpj')}
                        touched={touched.cnpj}
                        error={errors.cnpj}
                        inputMode="numeric"
                        placeholder="00.000.000/0000-00"
                        disabled={busy}
                      />
                      <Field
                        id="phone"
                        label="Telefone"
                        optional
                        value={form.phone}
                        onChange={(v) => setField('phone', formatPhoneInput(v))}
                        onBlur={() => touch('phone')}
                        touched={touched.phone}
                        error={errors.phone}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(00) 0000-0000"
                        disabled={busy}
                      />
                      <Field
                        id="companyEmail"
                        label="E-mail da empresa"
                        type="email"
                        value={form.companyEmail}
                        onChange={(v) => setField('companyEmail', v)}
                        onBlur={() => touch('companyEmail')}
                        touched={touched.companyEmail}
                        error={errors.companyEmail}
                        hint="Usado para enviar as faturas mensais."
                        autoComplete="email"
                        placeholder="financeiro@empresa.com.br"
                        disabled={busy}
                        className="su-span-2"
                      />
                    </div>
                  </section>
                ) : (
                  <section className="su-section" aria-labelledby="su-manager">
                    <h2 id="su-manager" className="su-section-title">
                      Responsável pelo RH
                      {companyName ? <span className="su-section-meta">{companyName}</span> : null}
                    </h2>
                    {form.phone.trim() ? (
                      <p className="su-step-prefill-hint" role="note">
                        Telefone da empresa: <strong>{form.phone}</strong>
                        {form.managerPhone.trim() ? (
                          <>
                            {' '}
                            — o campo <strong>Celular</strong> foi preenchido com esse número; altere se o responsável
                            usar outro.
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    <div className="su-grid">
                      <Field
                        id="managerName"
                        label="Nome completo"
                        value={form.managerName}
                        onChange={(v) => setField('managerName', v)}
                        onBlur={() => touch('managerName')}
                        touched={touched.managerName}
                        error={errors.managerName}
                        autoComplete="name"
                        disabled={busy}
                        className="su-span-2"
                      />
                      <Field
                        id="managerCpf"
                        label="CPF"
                        value={form.managerCpf}
                        onChange={(v) => setField('managerCpf', formatCpfInput(v))}
                        onBlur={() => touch('managerCpf')}
                        touched={touched.managerCpf}
                        error={errors.managerCpf}
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        disabled={busy}
                      />
                      <Field
                        id="managerPhone"
                        label="Celular"
                        value={form.managerPhone}
                        onChange={(v) => setField('managerPhone', formatPhoneInput(v))}
                        onBlur={() => touch('managerPhone')}
                        touched={touched.managerPhone}
                        error={errors.managerPhone}
                        hint={
                          form.phone.trim()
                            ? 'Sugerimos o mesmo número informado em Telefone na etapa anterior; ajuste se for outro.'
                            : undefined
                        }
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(00) 00000-0000"
                        disabled={busy}
                      />
                      <Field
                        id="managerEmail"
                        label="E-mail de acesso"
                        type="email"
                        value={form.managerEmail}
                        onChange={(v) => setField('managerEmail', v)}
                        onBlur={() => touch('managerEmail')}
                        touched={touched.managerEmail}
                        error={errors.managerEmail}
                        hint="Você entra no portal com este e-mail."
                        autoComplete="email"
                        placeholder="nome@empresa.com.br"
                        disabled={busy}
                        className="su-span-2"
                      />
                      <Field
                        id="password"
                        label="Crie uma senha"
                        password
                        value={form.password}
                        onChange={(v) => setField('password', v)}
                        onBlur={() => touch('password')}
                        touched={touched.password}
                        error={errors.password}
                        autoComplete="new-password"
                        disabled={busy}
                      />
                      <Field
                        id="passwordConfirm"
                        label="Confirme a senha"
                        password
                        value={confirm}
                        onChange={setConfirm}
                        onBlur={() => touch('passwordConfirm')}
                        touched={touched.passwordConfirm}
                        error={errors.passwordConfirm}
                        autoComplete="new-password"
                        disabled={busy}
                      />
                      {form.password ? (
                        <div className={`su-strength su-strength--${strength.score} su-span-2`} aria-live="polite">
                          <span className="su-strength-bar" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>
                          <span className="su-strength-label">
                            Força da senha: <strong>{strength.label}</strong>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </section>
                )}

                {formError ? (
                  <p className="su-banner su-banner--error" role="alert">
                    {formError}
                  </p>
                ) : null}

                <div className="su-actions">
                  {step === 1 ? (
                    <button type="button" className="btn btn-ghost su-back" onClick={() => setStep(0)} disabled={busy}>
                      Voltar
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="submit" className="btn btn-primary su-primary" disabled={busy}>
                    {step === 0 ? 'Continuar' : busy ? 'Enviando cadastro…' : 'Enviar cadastro'}
                  </button>
                </div>

                {step === 1 ? (
                  <p className="su-legal">
                    Ao enviar, você confirma que representa a empresa e autoriza a {MOVLY_DISPLAY_NAME} a validar os
                    dados informados.
                  </p>
                ) : null}
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
