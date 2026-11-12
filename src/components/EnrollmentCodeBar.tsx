type EnrollmentCodeBarProps = {
  companyStatus?: string;
  codeLoading: boolean;
  enrollmentCode: string | null;
  codeError: string | null;
  copyBusy: boolean;
  copyLinkBusy?: boolean;
  onCopy: () => void;
  onCopyLink?: () => void;
};

export function EnrollmentCodeBar({
  companyStatus,
  codeLoading,
  enrollmentCode,
  codeError,
  copyBusy,
  copyLinkBusy = false,
  onCopy,
  onCopyLink,
}: EnrollmentCodeBarProps) {
  const active = companyStatus === 'active';

  return (
    <section
      className="enrollment-code-banner"
      aria-label="Código de adesão da empresa"
    >
      <div className="enrollment-code-banner__inner">
        <div className="enrollment-code-banner__copy">
          <p className="enrollment-code-banner__eyebrow">Código da empresa</p>
          {!active ? (
            <p className="enrollment-code-banner__hint">
              Empresa com status <strong>{companyStatus ?? 'pendente'}</strong>. O código aparece após
              aprovação no <strong>Painel Admin</strong> (Corporativo → Empresas → Aprovar).
            </p>
          ) : codeLoading ? (
            <p className="enrollment-code-banner__hint">Carregando código…</p>
          ) : enrollmentCode ? (
            <>
              <p className="enrollment-code-banner__hint">
                Compartilhe o código ou o <strong>link de convite</strong> — no app,{' '}
                <strong>Minha conta</strong> → informar código.
              </p>
            </>
          ) : (
            <p className="enrollment-code-banner__hint page-error">
              {codeError ?? 'Não foi possível carregar o código.'}
            </p>
          )}
        </div>

        {active && !codeLoading && enrollmentCode ? (
          <div className="enrollment-code-banner__code">
            <code className="enrollment-code-banner__value">{enrollmentCode}</code>
            <div className="enrollment-code-banner__actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm enrollment-code-banner__btn"
                disabled={copyBusy}
                onClick={() => void onCopy()}
              >
                Copiar código
              </button>
              {onCopyLink ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm enrollment-code-banner__btn"
                  disabled={copyLinkBusy}
                  onClick={() => void onCopyLink()}
                >
                  Copiar link de convite
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
