import React, { useState, useEffect } from 'react';

// Generates an offline, lightweight, high-contrast SVG Data URI tailored to FMCG trade categories
export function getCategoryFallbackSvg(category?: string, name?: string): string {
  const cat = (category || '').toLowerCase();
  const title = (name || category || 'Wholesale FMCG').slice(0, 24);
  
  let bgGradientStart = '#1e293b'; // slate-800
  let bgGradientEnd = '#0f172a'; // slate-900
  let accentColor = '#38bdf8'; // sky-400
  let iconPath = '';
  let categoryLabel = 'FMCG STAPLE';

  if (cat.includes('flour') || cat.includes('grain') || cat.includes('rice') || cat.includes('baking')) {
    bgGradientStart = '#78350f'; // amber-900
    bgGradientEnd = '#451a03'; // amber-950
    accentColor = '#fcd34d'; // amber-300
    categoryLabel = 'GRAINS & FLOUR';
    // Sack / Wheat icon
    iconPath = '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="' + accentColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (cat.includes('oil') || cat.includes('fat') || cat.includes('spread') || cat.includes('margarine')) {
    bgGradientStart = '#854d0e'; // yellow-800
    bgGradientEnd = '#713f12'; // yellow-900
    accentColor = '#facc15'; // yellow-400
    categoryLabel = 'OILS & FATS';
    // Jerrycan / Oil jug icon
    iconPath = '<rect x="6" y="8" width="12" height="13" rx="2" stroke="' + accentColor + '" stroke-width="2"/><path d="M10 4h4v4h-4zM6 10h4M14 10h4" stroke="' + accentColor + '" stroke-width="2"/>';
  } else if (cat.includes('tea') || cat.includes('beverage') || cat.includes('chai')) {
    bgGradientStart = '#064e3b'; // emerald-900
    bgGradientEnd = '#022c22'; // emerald-950
    accentColor = '#34d399'; // emerald-400
    categoryLabel = 'BEVERAGES & TEA';
    // Tea cup / leaf icon
    iconPath = '<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 2v3M10 2v3M14 2v3" stroke="' + accentColor + '" stroke-width="2" stroke-linecap="round"/>';
  } else if (cat.includes('clean') || cat.includes('soap') || cat.includes('laundry') || cat.includes('detergent') || cat.includes('hygiene')) {
    bgGradientStart = '#1e3a8a'; // blue-900
    bgGradientEnd = '#172554'; // blue-950
    accentColor = '#60a5fa'; // blue-400
    categoryLabel = 'CLEANING & HYGIENE';
    // Sparkle / Soap bar icon
    iconPath = '<rect x="4" y="6" width="16" height="12" rx="3" stroke="' + accentColor + '" stroke-width="2"/><path d="M9 10h6M9 14h3" stroke="' + accentColor + '" stroke-width="2" stroke-linecap="round"/>';
  } else if (cat.includes('sugar') || cat.includes('sweet')) {
    bgGradientStart = '#047857'; // emerald-700
    bgGradientEnd = '#064e3b'; // emerald-900
    accentColor = '#a7f3d0'; // emerald-200
    categoryLabel = 'SUGAR & SWEETENERS';
    // Cube icon
    iconPath = '<path d="m21 16-9 5-9-5V8l9-5 9 5v8zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" stroke="' + accentColor + '" stroke-width="2"/>';
  } else if (cat.includes('snack') || cat.includes('peanut') || cat.includes('confectionery')) {
    bgGradientStart = '#7c2d12'; // orange-900
    bgGradientEnd = '#431407'; // orange-950
    accentColor = '#fb923c'; // orange-400
    categoryLabel = 'SNACKS & NUTS';
    // Snack pack icon
    iconPath = '<path d="M6 3h12l2 18H4L6 3zM6 8h12M10 13h4" stroke="' + accentColor + '" stroke-width="2" stroke-linecap="round"/>';
  } else if (cat.includes('bakery') || cat.includes('bread')) {
    bgGradientStart = '#78350f'; // amber-900
    bgGradientEnd = '#451a03'; // amber-950
    accentColor = '#fde68a'; // amber-200
    categoryLabel = 'BAKERY & FRESH';
    // Loaf icon
    iconPath = '<rect x="4" y="8" width="16" height="10" rx="4" stroke="' + accentColor + '" stroke-width="2"/><path d="M8 8v4M12 8v4M16 8v4" stroke="' + accentColor + '" stroke-width="2" stroke-linecap="round"/>';
  } else {
    // Universal FMCG Master Carton
    iconPath = '<rect x="3" y="6" width="18" height="14" rx="2" stroke="' + accentColor + '" stroke-width="2"/><path d="M3 10h18M10 6v14" stroke="' + accentColor + '" stroke-width="2"/>';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}"/>
        <stop offset="100%" stop-color="${bgGradientEnd}"/>
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="320" height="240" fill="url(#bgGrad)"/>
    <rect width="320" height="240" fill="url(#grid)"/>
    <g transform="translate(148, 70) scale(1)">
      <g transform="translate(-12, -12)">
        ${iconPath}
      </g>
    </g>
    <rect x="70" y="132" width="180" height="20" rx="4" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="160" y="146" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="9" font-weight="700" letter-spacing="1.5" fill="${accentColor}" text-anchor="middle">${categoryLabel}</text>
    <text x="160" y="178" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="600" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="160" y="196" font-family="monospace" font-size="9" font-weight="400" fill="#94a3b8" text-anchor="middle">WAYNO WHOLESALE VERIFIED</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Normalizes URLs: converts old dev-only `/src/assets/images/` to production-safe `/assets/images/`
export function normalizeImageUrl(url?: string, category?: string, name?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getCategoryFallbackSvg(category, name);
  }
  const trimmed = url.trim();
  // Fix production Vite asset path resolution: /src/assets/ -> /assets/
  if (trimmed.startsWith('/src/assets/')) {
    return trimmed.replace('/src/assets/', '/assets/');
  }
  return trimmed;
}

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  category?: string;
  productName?: string;
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Wholesale FMCG product',
  category,
  productName,
  fallbackSrc,
  className = '',
  loading = 'lazy',
  ...restProps
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    return normalizeImageUrl(src, category, productName || alt);
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setImgSrc(normalizeImageUrl(src, category, productName || alt));
  }, [src, category, productName, alt]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fallback = fallbackSrc || getCategoryFallbackSvg(category, productName || alt);
      setImgSrc(fallback);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...restProps}
    />
  );
};
