// Public read-only viewer (spec §12 sharing): anyone with the link `/share/:deckId?t=<token>` can
// watch the deck. It reuses the present-mode camera flight, but reads through the token-gated public
// queries (publicDeck / publicSlides / public components via SlideThumb's `token`) so no ownership or
// collaborator membership is required — the share token is the bearer credential.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useQuery } from '@rindle/react'
import { publicDeckQuery, publicSlidesQuery } from '../../shared/queries'
import { SlideThumb } from '../editor/SlideThumb'
import { resolveSurface } from '../editor/types'
import { UserStyle } from '../editor/CssEditor'
import { flightFor } from '../editor/transitions'
import { SLIDE_H, SLIDE_W } from '../config'

export const Route = createFileRoute('/share/$deckId')({
  component: Share,
  validateSearch: (s: Record<string, unknown>): { t: string } => ({
    t: typeof s.t === 'string' ? s.t : '',
  }),
})

const WORLD = SLIDE_W / 240

interface PlaySlide {
  id: string
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
  background: string
  surface: string
}

function Share() {
  const { deckId } = Route.useParams()
  const { t: token } = Route.useSearch()

  if (!token)
    return (
      <div className="share-gate">
        <img src="/strut-logo.png" alt="Strut" className="share-gate__logo" />
        <p>This share link is missing its access token.</p>
      </div>
    )
  return <ShareViewer deckId={deckId} token={token} />
}

function ShareViewer({ deckId, token }: { deckId: string; token: string }) {
  const deck = useQuery(publicDeckQuery({ deckId, token })) as unknown as {
    title: string
    background: string
    surface: string
    custom_stylesheet: string
    canned_transition: string
  } | null
  const slides = useQuery(
    publicSlidesQuery({ deckId, token }),
  ) as unknown as PlaySlide[]
  const [i, setI] = useState(0)
  const [vp, setVp] = useState({ w: 1280, h: 720 })
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // The public deck syncs asynchronously; give it a beat before declaring the link dead.
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1500)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key))
        setI((n) => Math.min(slides.length - 1, n + 1))
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key))
        setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [slides.length])

  if (!deck || slides.length === 0) {
    if (!ready) return <div className="strut-boot">Loading shared deck…</div>
    return (
      <div className="share-gate">
        <img src="/strut-logo.png" alt="Strut" className="share-gate__logo" />
        <p>
          {!deck
            ? "This deck isn't shared, or the link is invalid."
            : 'This shared deck has no slides yet.'}
        </p>
      </div>
    )
  }

  const active = slides[Math.min(i, slides.length - 1)]
  const zoom =
    (Math.min(vp.w / SLIDE_W, vp.h / SLIDE_H) * 0.92) /
    ((active.imp_scale || 3) / 3)
  const acx = active.x * WORLD
  const acy = active.y * WORLD
  const surf = resolveSurface(active.surface, deck?.surface)
  const flight = flightFor(deck?.canned_transition)
  const camTransition = flight.duration
    ? `transform ${flight.duration}ms ${flight.easing}`
    : 'none'

  return (
    <div
      className="play"
      onClick={() => setI((n) => Math.min(slides.length - 1, n + 1))}
      style={{
        position: 'fixed',
        inset: 0,
        background: surf,
        overflow: 'hidden',
        perspective: 1000,
      }}
    >
      <UserStyle css={deck?.custom_stylesheet} />
      <div
        className="play__cam"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformStyle: 'preserve-3d',
          transition: camTransition,
          transform: `translate(${vp.w / 2}px, ${vp.h / 2}px) rotate(${-active.rotate_z}rad) scale(${zoom}) translate(${-acx}px, ${-acy}px)`,
        }}
      >
        {slides.map((s) => (
          <div
            key={s.id}
            className="strut-surface"
            style={{
              position: 'absolute',
              left: s.x * WORLD,
              top: s.y * WORLD,
              width: SLIDE_W,
              height: SLIDE_H,
              overflow: 'hidden',
              boxShadow: '0 10px 60px rgba(0,0,0,.6)',
              transform: `translate(-50%, -50%) rotateX(${s.rotate_x}rad) rotateY(${s.rotate_y}rad) rotateZ(${s.rotate_z}rad) scale(${(s.imp_scale || 3) / 3})`,
              opacity: s.id === active.id ? 1 : 0.55,
              transition: `opacity ${flight.duration || 400}ms`,
            }}
          >
            <SlideThumb slide={s} deck={deck} width={SLIDE_W} token={token} />
          </div>
        ))}
      </div>
      <div className="ov-hint" style={{ position: 'fixed' }}>
        {i + 1} / {slides.length} · → next · ← back
      </div>
      <div className="share-badge">
        <img src="/strut-logo.png" alt="Strut" />
        <span>shared read-only</span>
      </div>
    </div>
  )
}
