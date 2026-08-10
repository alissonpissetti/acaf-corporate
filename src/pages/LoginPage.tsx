import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AcafConnectLogo } from '../components/AcafConnectLogo';
import { getCorporateToken } from '../api/auth';
import { apiHealth } from '../api/client';
import { useCorporate } from '../corporateContext';
import './LoginPage.css';

export function LoginPage() {
  const { loggedIn, login, loading } = useCorporate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);

    if (apiOnline === false) {
      setFormError(
        'API indisponível. No Coolify, defina API_BACKEND_URL (runtime) com a URL pública da acaf-api.',
      );
      return;
    }

    setBusy(true);
    try {
      await login(username, password);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell login-shell-simple">
      <div className="login-panel login-panel-full">
        <div className="login-panel-inner">
          <AcafConnectLogo height={48} className="acaf-connect-logo--login" />
          <h1 className="login-panel-title">Portal corporativo</h1>
          <p className="login-panel-lead">
            Gestão de colaboradores e benefício ACAF Connect para sua empresa.
          </p>

          {apiOnline === false ? (
            <p className="login-form-error" role="alert">
              Não foi possível contactar a API. No Coolify, configure{' '}
              <code>API_BACKEND_URL</code> (variável de <strong>runtime</strong>) com a URL pública da
              acaf-api (porta 80, sem :8787). O portal usa o proxy <code>/api</code> do nginx.
            </p>
          ) : null}

          <form className="login-form" onSubmit={(ev) => void onSubmit(ev)}>
            <div className="field">
              <label htmlFor="login-user">E-mail ou CPF</label>
              <input
                id="login-user"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                disabled={busy || loading}
              />
            </div>
            <div className="field">
              <label htmlFor="login-pass">Senha</label>
              <input
                id="login-pass"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                disabled={busy || loading}
              />
            </div>

            {formError && <p className="login-form-error">{formError}</p>}

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={busy || loading || apiOnline === false}
            >
              {busy || loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

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
