import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getInvitePreview } from '../api/client';

function ActivateWithCode({ code }: { code: string }) {
  return (
    <>
      <p className="login-panel-lead">
        O benefício é ativado no <strong>app mobile</strong>, não neste portal.
      </p>
      <div className="enrollment-code-inline">
        <span>Código de adesão</span>
        <code>{code}</code>
      </div>
      <ol className="activate-steps">
        <li>Baixe o aplicativo Movly (loja do seu celular).</li>
        <li>Abra <strong>Minha conta</strong>.</li>
        <li>Informe o código acima e escolha seu plano.</li>
        <li>Finalize o cadastro.</li>
      </ol>
      <Link to="/login" className="btn btn-primary login-submit">
        Ir ao portal do RH
      </Link>
    </>
  );
}

export function ActivatePage() {
  const [params] = useSearchParams();
  const codeFromUrl = params.get('code')?.trim() ?? '';
  const token = params.get('token')?.trim() ?? '';
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(codeFromUrl || null);
  const [loading, setLoading] = useState(Boolean(token) && !codeFromUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || codeFromUrl) return;

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
  }, [token, codeFromUrl]);

  const displayCode = enrollmentCode || codeFromUrl;

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-panel-inner">
          <h1 className="login-panel-title">Cadastro no app</h1>
          {loading ? (
            <p className="login-loading-text">Validando…</p>
          ) : (
            <>
              {companyName && (
                <p className="activate-company-name">
                  Empresa: <strong>{companyName}</strong>
                </p>
              )}
              {displayCode ? (
                <ActivateWithCode code={displayCode} />
              ) : (
                <p className="login-panel-lead">
                  Informe o <strong>código de adesão</strong> que o RH compartilhou ou abra o link completo do convite.
                </p>
              )}
              {error && <p className="login-form-error">{error}</p>}
              {!displayCode ? (
                <Link to="/login" className="btn btn-primary login-submit">
                  Ir ao portal do RH
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
