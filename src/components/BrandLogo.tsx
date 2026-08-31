import './BrandLogo.css';

type BrandLogoProps = {
  height?: number;
  className?: string;
};

export function BrandLogo({ height = 44, className }: BrandLogoProps) {
  const classes = ['brand-logo', className].filter(Boolean).join(' ');
  return (
    <img
      src="/branding/connect_lockup.png"
      alt="Connect"
      className={classes}
      height={height}
      width={Math.round(height * 2.35)}
      decoding="async"
    />
  );
}
