import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { PasswordInput } from '../components/PasswordInput';
import { getCorporateToken } from '../api/auth';
import { apiHealth } from '../api/client';
import { useCorporate } from '../corporateContext';
import './LoginPage.css';

const MODES = {
  CREDENTIALS: 'credentials',
  TOKEN: 'token',
  FORGOT: 'forgot',
} as const;

type LoginMode = (typeof MODES)[keyof typeof MODES];

function normalizePhoneInput(value: string): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, 11);
}

function formatPhoneDisplay(digits: string): string {
  const value = normalizePhoneInput(digits);
  if (value.length <= 2) return value;
  if (value.length <= 7) return `(${value.slice(0, 2)}) ${value.slice(2)}`;
  return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
}

export function LoginPage() {
  const { loggedIn, login, loginWithOtp, requestOtp, resetPasswordWithOtp, loading } =
    useCorporate();

  const [mode, setMode] = useState<LoginMode>(MODES.CREDENTIALS);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void apiHealth().then(setApiOnline);
  }, []);

  if (loading && getCorporateToken()) {
    return (
      <div className="login-shell login-shell-loading">
        <p className="login-loading-text">Restaurando sessão…</p>
      </div>
    );
  }

  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  const resetMessages = () => {
    setFormError(null);
    setFormInfo(null);
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setStep(1);
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    resetMessages();
  };

  const ensureApi = (): boolean => {
    if (apiOnline === false) {
      setFormError(
        'API indisponível. No Coolify, defina API_BACKEND_URL (runtime) com a URL pública da connect-api.',
      );
      return false;
    }
    return true;
  };

  const onSubmitCredentials = async (ev: React.FormEvent) => {
    ev.preventDefault();
    resetMessages();
    if (!ensureApi()) return;

    setBusy(true);
    try {
      await login(username, password);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };

  const onRequestOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    resetMessages();
    if (!ensureApi()) return;

    setBusy(true);
    try {
      const purpose = mode === MODES.FORGOT ? 'password_reset' : 'login';
      const result = await requestOtp(mobilePhone, purpose);
      setFormInfo(result.message ?? 'Código enviado para o celular.');
      setStep(2);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível enviar o código.');
    } finally {
      setBusy(false);
    }
  };

  const onSubmitTokenLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    resetMessages();
    if (!ensureApi()) return;

    setBusy(true);
    try {
      await loginWithOtp(mobilePhone, code);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Código inválido ou expirado.');
    } finally {
      setBusy(false);
    }
  };

  const onSubmitResetPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    resetMessages();

    if (newPassword.length < 6) {
      setFormError('Informe uma senha com ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('As senhas não conferem.');
      return;
    }
    if (!ensureApi()) return;

    setBusy(true);
    try {
      const result = await resetPasswordWithOtp(mobilePhone, code, newPassword);
      setFormInfo(result.message ?? 'Senha alterada com sucesso.');
      switchMode(MODES.CREDENTIALS);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível redefinir a senha.');
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<LoginMode, { title: string; lead: string }> = {
    [MODES.CREDENTIALS]: {
      title: 'Portal corporativo',
      lead: 'Acompanhe colaboradores, adesões e faturas do benefício da sua empresa.',
    },
    [MODES.TOKEN]: {
      title: step === 1 ? 'Entrar com código no celular' : 'Validar código',
      lead:
        step === 1
          ? 'Informe o celular cadastrado do responsável pela empresa para receber um código.'
          : 'Digite o código de 6 dígitos enviado para o seu celular.',
    },
    [MODES.FORGOT]: {
      title: step === 1 ? 'Recuperar senha' : 'Nova senha',
      lead:
        step === 1
          ? 'Informe o celular cadastrado para receber um código de verificação.'
          : 'Informe o código recebido e escolha uma nova senha de acesso.',
    },
  };

  const copy = titles[mode];

  return (
    <div className="login-shell corp-auth">
      <section className="corp-auth-brand movly-grain" aria-hidden="true">
        <div className="corp-auth-lockup">
          <BrandLogo height={120} variant="gradient" className="corp-auth-logo" />
          <p className="corp-auth-tagline">
            bem-estar para empresas
            <br />e colaboradores
          </p>
        </div>
        <p className="corp-auth-foot">A vida acontece quando você se move.</p>
      </section>

      <div className="login-panel">
        <div className="login-panel-inner">
          <BrandLogo height={30} variant="purple" className="brand-logo--login" />
          <h1 className="login-panel-title">{copy.title}</h1>
          <p className="login-panel-lead">{copy.lead}</p>

          {apiOnline === false ? (
            <p className="login-form-error" role="alert">
              Não foi possível contactar a API. No Coolify, configure{' '}
              <code>API_BACKEND_URL</code> (variável de <strong>runtime</strong>) com a URL pública da
              connect-api (porta 80, sem :8787). O portal usa o proxy <code>/api</code> do nginx.
            </p>
          ) : null}

          {mode === MODES.CREDENTIALS ? (
            <form className="login-form" onSubmit={(ev) => void onSubmitCredentials(ev)}>
              <div className="field">
                <label htmlFor="login-user">E-mail ou CPF</label>
                <input
                  id="login-user"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(ev) => setUsername(ev.target.value)}
                  disabled={busy || loading}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="login-pass">Senha</label>
                <PasswordInput
                  id="login-pass"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  disabled={busy || loading}
                  required
                />
              </div>

              <div className="login-links">
                <button
                  type="button"
                  className="login-link"
                  onClick={() => switchMode(MODES.FORGOT)}
                >
                  Esqueci minha senha
                </button>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => switchMode(MODES.TOKEN)}
                >
                  Entrar com código no celular
                </button>
              </div>

              {formError ? <p className="login-form-error">{formError}</p> : null}
              {formInfo ? <p className="login-form-info">{formInfo}</p> : null}

              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={busy || loading || apiOnline === false}
              >
                {busy || loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          ) : null}

          {mode === MODES.TOKEN ? (
            step === 1 ? (
              <form className="login-form" onSubmit={(ev) => void onRequestOtp(ev)}>
                <div className="field">
                  <label htmlFor="login-phone">Celular</label>
                  <input
                    id="login-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                    value={formatPhoneDisplay(mobilePhone)}
                    onChange={(ev) => setMobilePhone(normalizePhoneInput(ev.target.value))}
                    disabled={busy || loading}
                    required
                  />
                </div>

                {formError ? <p className="login-form-error">{formError}</p> : null}
                {formInfo ? <p className="login-form-info">{formInfo}</p> : null}

                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={busy || loading || apiOnline === false}
                >
                  {busy ? 'Enviando…' : 'Enviar código'}
                </button>

                <button
                  type="button"
                  className="login-back-link"
                  onClick={() => switchMode(MODES.CREDENTIALS)}
                >
                  Voltar ao login
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={(ev) => void onSubmitTokenLogin(ev)}>
                <div className="field">
                  <label htmlFor="login-otp">Código no celular</label>
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    onChange={(ev) => setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={busy || loading}
                    required
                  />
                </div>

                {formError ? <p className="login-form-error">{formError}</p> : null}
                {formInfo ? <p className="login-form-info">{formInfo}</p> : null}

                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={busy || loading || apiOnline === false}
                >
                  {busy ? 'Validando…' : 'Entrar'}
                </button>

                <button
                  type="button"
                  className="login-back-link"
                  onClick={() => {
                    setStep(1);
                    setCode('');
                    resetMessages();
                  }}
                >
                  Reenviar código
                </button>
              </form>
            )
          ) : null}

          {mode === MODES.FORGOT ? (
            step === 1 ? (
              <form className="login-form" onSubmit={(ev) => void onRequestOtp(ev)}>
                <div className="field">
                  <label htmlFor="forgot-phone">Celular</label>
                  <input
                    id="forgot-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                    value={formatPhoneDisplay(mobilePhone)}
                    onChange={(ev) => setMobilePhone(normalizePhoneInput(ev.target.value))}
                    disabled={busy || loading}
                    required
                  />
                </div>

                {formError ? <p className="login-form-error">{formError}</p> : null}
                {formInfo ? <p className="login-form-info">{formInfo}</p> : null}

                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={busy || loading || apiOnline === false}
                >
                  {busy ? 'Enviando…' : 'Enviar código'}
                </button>

                <button
                  type="button"
                  className="login-back-link"
                  onClick={() => switchMode(MODES.CREDENTIALS)}
                >
                  Voltar ao login
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={(ev) => void onSubmitResetPassword(ev)}>
                <div className="field">
                  <label htmlFor="forgot-otp">Código no celular</label>
                  <input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    onChange={(ev) => setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={busy || loading}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="forgot-new-pass">Nova senha</label>
                  <PasswordInput
                    id="forgot-new-pass"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    disabled={busy || loading}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="forgot-confirm-pass">Confirmar senha</label>
                  <PasswordInput
                    id="forgot-confirm-pass"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    disabled={busy || loading}
                    required
                  />
                </div>

                {formError ? <p className="login-form-error">{formError}</p> : null}
                {formInfo ? <p className="login-form-info">{formInfo}</p> : null}

                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={busy || loading || apiOnline === false}
                >
                  {busy ? 'Salvando…' : 'Redefinir senha'}
                </button>

                <button
                  type="button"
                  className="login-back-link"
                  onClick={() => {
                    setStep(1);
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    resetMessages();
                  }}
                >
                  Reenviar código
                </button>
              </form>
            )
          ) : null}

          <p className="login-panel-foot">
            Sua empresa ainda não está cadastrada?{' '}
            <Link to="/cadastro" className="login-link">
              Cadastrar empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
