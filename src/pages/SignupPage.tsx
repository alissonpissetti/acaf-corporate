import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AcafConnectLogo } from '../components/AcafConnectLogo';
import { corporateSignup } from '../api/auth';
import { apiHealth } from '../api/client';
import { useCorporate } from '../corporateContext';
import {
  formatCnpjInput,
  formatCpfInput,
  formatPhoneInput,
} from '../utils/personInput';
import {
  clearSignupDraft,
  loadSignupDraft,
  saveSignupDraft,
  type SignupDraft,
} from '../utils/signupDraft';
import './LoginPage.css';

export function SignupPage() {
  const { loggedIn } = useCorporate();
  const [form, setForm] = useState<SignupDraft>(loadSignupDraft);
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

  const setField = <K extends keyof SignupDraft>(key: K, value: SignupDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (apiOnline === false) {
      setFormError('API indisponível.');
      return;
    }

    setBusy(true);
    try {
      const result = await corporateSignup({
        legalName: form.legalName,
        tradeName: form.tradeName || form.legalName,
        cnpj: form.cnpj,
        companyEmail: form.companyEmail,
        phone: form.phone || undefined,
        managerName: form.managerName,
        managerEmail: form.managerEmail,
        managerCpf: form.managerCpf,
        managerPhone: form.managerPhone,
        password: form.password,
      });
      clearSignupDraft();
      setSuccess(result.message);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível cadastrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell login-shell-simple">
      <div className="login-panel login-panel-full login-panel-wide">
        <div className="login-panel-inner">
          <AcafConnectLogo height={40} className="acaf-connect-logo--login" />
          <h1 className="login-panel-title">Cadastrar empresa</h1>
          <p className="login-panel-lead">
            Preencha os dados da empresa e do gestor de RH. Após o cadastro, aguarde aprovação da ACAF.
          </p>

          {success ? (
            <div className="signup-success">
              <p>{success}</p>
              <Link to="/login" className="btn btn-primary">
                Ir para login
              </Link>
            </div>
          ) : (
            <form className="login-form signup-form" onSubmit={(ev) => void onSubmit(ev)}>
              <fieldset className="signup-fieldset">
                <legend>Dados da empresa</legend>
                <div className="field">
                  <label htmlFor="legalName">Razão social</label>
                  <input
                    id="legalName"
                    value={form.legalName}
                    onChange={(ev) => setField('legalName', ev.target.value)}
                    required
                    disabled={busy}
                  />
                </div>
                <div className="field">
                  <label htmlFor="tradeName">Nome fantasia</label>
                  <input
                    id="tradeName"
                    value={form.tradeName}
                    onChange={(ev) => setField('tradeName', ev.target.value)}
                    disabled={busy}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="cnpj">CNPJ</label>
                    <input
                      id="cnpj"
                      value={form.cnpj}
                      onChange={(ev) => setField('cnpj', formatCnpjInput(ev.target.value))}
                      inputMode="numeric"
                      placeholder="00.000.000/0000-00"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="companyEmail">E-mail da empresa</label>
                    <input
                      id="companyEmail"
                      type="email"
                      value={form.companyEmail}
                      onChange={(ev) => setField('companyEmail', ev.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="phone">Telefone (opcional)</label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(ev) => setField('phone', formatPhoneInput(ev.target.value))}
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    disabled={busy}
                  />
                </div>
              </fieldset>

              <fieldset className="signup-fieldset">
                <legend>Gestor de RH</legend>
                <div className="field">
                  <label htmlFor="managerName">Nome completo</label>
                  <input
                    id="managerName"
                    value={form.managerName}
                    onChange={(ev) => setField('managerName', ev.target.value)}
                    required
                    disabled={busy}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="managerEmail">E-mail</label>
                    <input
                      id="managerEmail"
                      type="email"
                      value={form.managerEmail}
                      onChange={(ev) => setField('managerEmail', ev.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="managerCpf">CPF</label>
                    <input
                      id="managerCpf"
                      value={form.managerCpf}
                      onChange={(ev) => setField('managerCpf', formatCpfInput(ev.target.value))}
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="managerPhone">Celular</label>
                    <input
                      id="managerPhone"
                      value={form.managerPhone}
                      onChange={(ev) => setField('managerPhone', formatPhoneInput(ev.target.value))}
                      inputMode="tel"
                      placeholder="(00) 00000-0000"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="password">Senha de acesso</label>
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(ev) => setField('password', ev.target.value)}
                      required
                      minLength={6}
                      disabled={busy}
                    />
                  </div>
                </div>
              </fieldset>

              {formError && <p className="login-form-error">{formError}</p>}

              <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
                {busy ? 'Enviando…' : 'Cadastrar empresa'}
              </button>
            </form>
          )}

          <p className="login-panel-foot">
            Já tem cadastro?{' '}
            <Link to="/login" className="login-link">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
