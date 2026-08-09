import { useState, useEffect } from 'react';

// ── Three-tier responsive breakpoint hook ──────────────────────────────────
// Desktop:   >= 1024px  → current fixed-width layout (untouched)
// Tablet:    768–1023px → reflowed desktop (temporary, improved later)
// Mobile:    <= 767px   → portrait-optimized MobileGameLayout
//
// Synchronous init prevents the desktop→mobile remount flash that resets
// component state (matching the pattern from Rapid Fire mobile's use-mobile.jsx).

const DESKTOP_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

export function useViewportTier() {
  const [tier, setTier] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < TABLET_BREAKPOINT) return 'mobile';
    if (w < DESKTOP_BREAKPOINT) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const onChange = () => {
      const w = window.innerWidth;
      if (w < TABLET_BREAKPOINT) setTier('mobile');
      else if (w < DESKTOP_BREAKPOINT) setTier('tablet');
      else setTier('desktop');
    };
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
  }, []);

  return tier;
}

// Convenience boolean — true only on mobile portrait tier
export function useIsMobile() {
  const tier = useViewportTier();
  return tier === 'mobile';
}
