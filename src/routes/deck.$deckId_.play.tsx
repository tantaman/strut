import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useQuery } from '@rindle/react'
import { deckQuery, slidesQuery } from '../../shared/queries'
import { SlideThumb } from '../editor/SlideThumb'
import { resolveSurface } from '../editor/types'
import { UserStyle } from '../editor/CssEditor'
import { flightFor } from '../editor/transitions'
import { SLIDE_H, SLIDE_W } from '../config'

export const Route = createFileRoute('/deck/$deckId_/play')({ component: Play })

// Overview (x,y) are in "card" units (240px wide); the world places full 1280px slides, so scale up.
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

function Play() {
  const { deckId } = Route.useParams()
  const deck = useQuery(deckQuery({ deckId })) as unknown as {
    background: string
    surface: string
    custom_stylesheet: string
    canned_transition: string
  } | null
  const slides = useQuery(slidesQuery({ deckId })) as unknown as PlaySlide[]
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [vp, setVp] = useState({ w: 1280, h: 720 })

  useLayoutEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key))
        setI((n) => Math.min(slides.length - 1, n + 1))
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key))
        setI((n) => Math.max(0, n - 1))
      else if (e.key === 'Escape')
        navigate({ to: '/deck/$deckId', params: { deckId } })
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [slides.length, navigate, deckId])

  if (slides.length === 0)
    return <div className="strut-boot">No slides to present.</div>

  const active = slides[Math.min(i, slides.length - 1)]
  const zoom =
    (Math.min(vp.w / SLIDE_W, vp.h / SLIDE_H) * 0.92) /
    ((active.imp_scale || 3) / 3)
  const acx = active.x * WORLD
  const acy = active.y * WORLD
  // The presentation surface (deck-wide "table") shows behind the flying slide cards.
  const surf = resolveSurface(active.surface, deck?.surface)
  // The chosen canned transition (spec §7.2) drives the camera-flight feel.
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
          // Counter the active slide's full 3-D orientation (inverse rotation, reversed order) so it
          // flies to dead-centre and face-on regardless of layout; other cards keep their relative
          // tilt (the impress parallax). For flat layouts rotate_x/y are 0 → same as before.
          // The zoom MUST be a uniform 3-D scale (scale3d, not scale): a 2-D scale sitting between the
          // camera's inverse rotation and a card's rotation doesn't commute, leaving the active slide
          // partly tilted. Uniform scale commutes with rotation, so the rotations cancel exactly.
          transform: `translate(${vp.w / 2}px, ${vp.h / 2}px) rotateZ(${-active.rotate_z}rad) rotateY(${-active.rotate_y}rad) rotateX(${-active.rotate_x}rad) scale3d(${zoom}, ${zoom}, ${zoom}) translate(${-acx}px, ${-acy}px)`,
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
              transform: `translate(-50%, -50%) rotateX(${s.rotate_x}rad) rotateY(${s.rotate_y}rad) rotateZ(${s.rotate_z}rad) scale3d(${(s.imp_scale || 3) / 3}, ${(s.imp_scale || 3) / 3}, ${(s.imp_scale || 3) / 3})`,
              opacity: s.id === active.id ? 1 : 0.55,
              transition: `opacity ${flight.duration || 400}ms`,
            }}
          >
            <SlideThumb slide={s} deck={deck} width={SLIDE_W} />
          </div>
        ))}
      </div>
      <div className="ov-hint" style={{ position: 'fixed' }}>
        {i + 1} / {slides.length} · → next · ← back · Esc exit
      </div>
    </div>
  )
}
