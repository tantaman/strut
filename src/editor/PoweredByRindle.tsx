// "Powered by rindle" attribution badge — a fixed bottom-right pill shown over the full-screen deck
// viewers (present + public share). Mirrors the top-left `.share-badge` styling. The mark is the
// rindle brand logo (ink tile + paper outline + orange accent dot) inlined so it needs no asset fetch
// and stays crisp at any density; the brand colours are fixed on purpose (a logo doesn't recolour with
// the theme). `stopPropagation` keeps a click on the badge from also advancing the slide, since the
// `.play` container advances on click.
export function PoweredByRindle() {
  return (
    <a
      className="powered-by"
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
