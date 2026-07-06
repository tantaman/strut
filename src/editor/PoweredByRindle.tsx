// "Powered by rindle" credit — Strut is the showcase app for the rindle sync platform, so this links
// back to rindle.sh from every surface. Two variants:
//   • 'float'  (default) — a fixed bottom-right pill for the chrome-less full-screen deck viewers
//                          (present + public share). Mirrors the `.share-badge` styling.
//   • 'inline'           — a compact credit that sits in the app's top chrome (editor header, dashboard
//                          brandbar), where a floating pill would collide with the Overview controls.
// The mark is the rindle brand logo (ink tile + paper outline + orange accent dot) inlined so it needs
// no asset fetch and stays crisp; its colours are fixed on purpose (a logo doesn't recolour with the
// theme). `stopPropagation` keeps a click on the badge from also advancing the slide when it sits inside
// the `.play` container (which advances on click); it's harmless in the header/brandbar.
export function PoweredByRindle({
  variant = 'float',
}: {
  variant?: 'float' | 'inline'
}) {
  return (
    <a
      className={variant === 'inline' ? 'powered-by powered-by--inline' : 'powered-by'}
      href="https://rindle.sh"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by rindle"
      onClick={(e) => e.stopPropagation()}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#171411" />
        <rect
          x="7.1"
          y="6.4"
          width="14.6"
          height="14.6"
          rx="4"
          fill="none"
          stroke="#f2eee7"
          strokeWidth="2.2"
        />
        <circle cx="23" cy="22.3" r="3.4" fill="#ff4d00" />
      </svg>
      <span>powered by rindle</span>
    </a>
  )
}
