import type { CSSProperties } from 'react';
import { brandLogoDimensions, BRAND_LOGO_SRC, type BrandLogoVariant } from './brandLogoPaths';
import './BrandLogo.css';

export type { BrandLogoVariant };

type BrandLogoProps = {
  height?: number;
  variant?: BrandLogoVariant;
  className?: string;
  noFixedDimensions?: boolean;
};

export function BrandLogo({
  height = 32,
  variant = 'purple',
  className,
  noFixedDimensions = false,
}: BrandLogoProps) {
  const src = BRAND_LOGO_SRC[variant];
  const dims = brandLogoDimensions(variant, height);
  const style: CSSProperties | undefined = noFixedDimensions
    ? undefined
    : { width: dims.width, height: dims.height };
  const classes = ['brand-logo', 'brand-logo--img', `brand-logo--${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} role="img" aria-label="movly. by ACAF" style={style}>
      <img className="brand-logo-img" src={src} alt="" width={dims.width} height={dims.height} decoding="async" />
    </span>
  );
}

type BrandMarkProps = {
  size?: number;
  tone?: 'purple' | 'lime';
  className?: string;
  bg?: string;
  fg?: string;
};

export function BrandMark({ size = 40, tone = 'purple', className, bg, fg }: BrandMarkProps) {
  const fontSize = Math.max(12, Math.round(size * 0.45));
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize,
    ...(bg ? { background: bg } : {}),
    ...(fg ? { color: fg } : {}),
  };

  return (
    <div
      className={['brand-mark', `brand-mark--${tone}`, className].filter(Boolean).join(' ')}
      role="img"
      aria-label="movly."
      style={style}
    >
      m
    </div>
  );
}

export function BrandGradients() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="movly-fill-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#89b4e0" />
          <stop offset="1" stopColor="#b3cdeb" />
        </linearGradient>
        <linearGradient id="movly-fill-purple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8254e4" />
          <stop offset="1" stopColor="#7579e5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
