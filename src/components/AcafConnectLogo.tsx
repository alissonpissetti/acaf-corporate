import './AcafConnectLogo.css';

type AcafConnectLogoProps = {
  /** Altura em px; largura proporcional ao lockup horizontal. */
  height?: number;
  className?: string;
};

export function AcafConnectLogo({ height = 44, className }: AcafConnectLogoProps) {
  const classes = ['acaf-connect-logo', className].filter(Boolean).join(' ');
  return (
    <img
      src="/branding/acaf_connect_lockup.png"
      alt="ACAF Connect"
      className={classes}
      height={height}
      width={Math.round(height * 2.35)}
      decoding="async"
    />
  );
}
