import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getInvitePreview } from '../api/client';

export function ActivatePage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    void (async () => {
      try {
        const data = await getInvitePreview(token);
        setCompanyName(data.companyName);
        const code =
          'enrollmentCode' in data && typeof data.enrollmentCode === 'string'
            ? data.enrollmentCode
            : null;
        setEnrollmentCode(code);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Convite inválido.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-panel-inner">
          <h1 className="login-panel-title">Cadastro no app</h1>
          {loading ? (
            <p className="login-loading-text">Validando…</p>
          ) : (
            <>
              <p className="login-panel-lead">
                O benefício é ativado no <strong>app mobile</strong>, não neste portal.
              </p>
              {companyName && (
                <p className="activate-company-name">
                  Empresa: <strong>{companyName}</strong>
                </p>
              )}
              {enrollmentCode && (
                <div className="enrollment-code-inline">
                  <span>Código de adesão</span>
                  <code>{enrollmentCode}</code>
                </div>
              )}
              <ol className="activate-steps">
                <li>Abra o aplicativo.</li>
                <li>Vá em <strong>Minha conta</strong>.</li>
                <li>Informe o código de adesão da sua empresa.</li>
                <li>Escolha o plano e finalize o cadastro.</li>
              </ol>
              {error && <p className="login-form-error">{error}</p>}
              <Link to="/login" className="btn btn-primary login-submit">
                Ir ao portal do RH
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
