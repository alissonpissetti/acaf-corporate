import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AcafConnectLogo } from '../components/AcafConnectLogo';
import { acceptInvite, getInvitePreview, type InvitePreview } from '../api/client';
import './LoginPage.css';
import './ActivatePage.css';

export function ActivatePage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Link de convite inválido.');
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const data = await getInvitePreview(token);
        setPreview(data);
        if (data.suggestions?.name) setName(data.suggestions.name);
        if (data.suggestions?.cpf) setCpf(data.suggestions.cpf);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Convite inválido.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }

    setBusy(true);
    try {
      await acceptInvite(token, {
        password,
        cpf,
        name: name.trim() || undefined,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ativar.');
    } finally {
      setBusy(false);
    }
  };

  const hasNameSuggestion = Boolean(preview?.suggestions?.name);
  const hasCpfSuggestion = Boolean(preview?.suggestions?.cpf);

  return (
    <div className="login-shell login-shell-simple">
      <div className="login-panel login-panel-full">
        <div className="login-panel-inner login-panel-wide">
          <AcafConnectLogo height={48} className="acaf-connect-logo--login" />
          <h1 className="login-panel-title">Ativar benefício</h1>

          {loading ? (
            <p className="login-loading-text">Validando convite…</p>
          ) : success ? (
            <div className="signup-success">
              <p>Conta ativada com sucesso! Baixe o app ACAF Connect e entre com seu e-mail e senha.</p>
            </div>
          ) : preview ? (
            <>
              <p className="login-panel-lead">
                Você foi convidado por <strong>{preview.companyName}</strong> para o benefício ACAF
                Connect. Confira os dados abaixo e complete a ativação da sua conta.
              </p>

              <form className="login-form signup-form" onSubmit={(ev) => void onSubmit(ev)}>
                <fieldset className="signup-fieldset">
                  <legend>Dados do colaborador</legend>

                  <div className="field">
                    <label htmlFor="email">E-mail</label>
                    <input id="email" value={preview.email} readOnly disabled />
                    <p className="activate-field-hint">Este convite está vinculado a este e-mail.</p>
                  </div>

                  {preview.suggestions?.mobilePhone ? (
                    <p className="activate-info-line">
                      Celular cadastrado pela empresa:{' '}
                      <strong>{preview.suggestions.mobilePhone}</strong>
                    </p>
                  ) : null}

                  <div className="field">
                    <label htmlFor="name">Nome completo</label>
                    <input
                      id="name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      disabled={busy}
                      placeholder="Como você quer aparecer no app"
                    />
                    {hasNameSuggestion ? (
                      <p className="activate-field-hint">
                        Sugestão do cadastro da empresa — confira e altere se necessário.
                      </p>
                    ) : null}
                  </div>

                  <div className="field">
                    <label htmlFor="cpf">CPF</label>
                    <input
                      id="cpf"
                      value={cpf}
                      onChange={(ev) => setCpf(ev.target.value)}
                      required
                      disabled={busy}
                      placeholder="000.000.000-00"
                    />
                    {hasCpfSuggestion ? (
                      <p className="activate-field-hint">
                        Sugestão do cadastro da empresa — confira e altere se necessário.
                      </p>
                    ) : null}
                  </div>
                </fieldset>

                <fieldset className="signup-fieldset">
                  <legend>Senha de acesso</legend>

                  <div className="field">
                    <label htmlFor="password">Senha</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(ev) => setPassword(ev.target.value)}
                      required
                      minLength={6}
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="confirmPassword">Confirmar senha</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(ev) => setConfirmPassword(ev.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                </fieldset>

                {error && <p className="login-form-error">{error}</p>}

                <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
                  {busy ? 'Ativando…' : 'Ativar conta'}
                </button>
              </form>
            </>
          ) : (
            <p className="login-form-error">{error ?? 'Convite inválido.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
