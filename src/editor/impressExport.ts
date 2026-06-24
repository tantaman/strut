// Standalone impress.js export (spec §9.2 — "the critical contract"). Produces a single self-contained
// HTML string: one `.step` per slide, positioned with the same world math as Present mode (so a deck
// plays identically), then impress.js (CDN) reads the data-* attributes and flies the camera.

import { SLIDE_H, SLIDE_W } from '../config'
import { componentSize } from './render'
import {
  cssHex,
  resolveBackground,
  resolveSurface,
  type AnyComponent,
} from './types'
import { flightFor } from './transitions'
import { scopeCss } from './css'
import type { DeckBundle } from './serialize'

// Overview (x,y) are in 240px "card" units; the world places full 1280px slides (matches play route).
const WORLD = SLIDE_W / 240
const deg = (rad: number) => (rad * 180) / Math.PI

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function componentHTML(c: AnyComponent): string {
  const { w, h } = componentSize(c)
  const transform = `rotate(${c.rotate || 0}rad) skewX(${c.skew_x || 0}rad) skewY(${c.skew_y || 0}rad)`
  let body = ''
  let extra = ''
  switch (c.kind) {
    case 'text':
      extra = `font-size:${c.size ?? 72}px;color:${cssHex(c.color, '111111')};font-family:'${esc(c.font_family || 'Lato')}',sans-serif;line-height:1.1;white-space:pre-wrap;max-width:1100px;`
      body = `<div class="cmp-text">${c.text && c.text.length ? c.text : 'Text'}</div>`
      break
    case 'image':
      body = c.src
        ? `<img src="${esc(c.src)}" style="width:100%;height:100%;object-fit:contain" alt="">`
        : ''
      break
    case 'shape':
      extra = `color:${cssHex(c.fill, '3498db')};`
      body = `<div style="width:100%;height:100%">${c.markup || ''}</div>`
      break
    case 'video':
      if (c.video_type === 'youtube' && c.short_src)
        body = `<iframe src="https://www.youtube.com/embed/${esc(c.short_src)}" style="width:100%;height:100%;border:0" allowfullscreen></iframe>`
      else
        body = `<video src="${esc(c.src || '')}" controls style="width:100%;height:100%"></video>`
      break
    case 'webframe':
      body = `<iframe src="${esc(c.src || '')}" style="width:100%;height:100%;border:0"></iframe>`
      break
  }
  const sizeStyle = c.kind === 'text' ? '' : `width:${w}px;height:${h}px;`
  return `<div class="cmp" style="position:absolute;left:${c.x}px;top:${c.y}px;${sizeStyle}transform:${transform};transform-origin:top left;${extra}">${body}</div>`
}

function stepHTML(
  slide: DeckBundle['slides'][number],
  components: AnyComponent[],
  deck: DeckBundle['deck'],
  index: number,
): string {
  const attrs: string[] = [
    `data-x="${Math.round(slide.x * WORLD)}"`,
    `data-y="${Math.round(slide.y * WORLD)}"`,
  ]
  if (slide.z) attrs.push(`data-z="${Math.round(slide.z)}"`)
  if (slide.rotate_x)
    attrs.push(`data-rotate-x="${deg(slide.rotate_x).toFixed(2)}"`)
  if (slide.rotate_y)
    attrs.push(`data-rotate-y="${deg(slide.rotate_y).toFixed(2)}"`)
  if (slide.rotate_z)
    attrs.push(`data-rotate-z="${deg(slide.rotate_z).toFixed(2)}"`)
  const scale = (slide.imp_scale || 3) / 3
  if (scale !== 1) attrs.push(`data-scale="${scale}"`)

  const bg = resolveBackground(slide.background, deck.background)
  const sorted = [...components].sort((a, b) => a.z_order - b.z_order)
  return `  <div class="step" data-state="strut-slide-${index}" ${attrs.join(' ')}>
    <div class="slideContainer strut-surface" style="width:${SLIDE_W}px;height:${SLIDE_H}px;background:${bg};overflow:hidden;position:relative">
${sorted.map((c) => '      ' + componentHTML(c)).join('\n')}
    </div>
  </div>`
}

export function toImpressHTML(bundle: DeckBundle): string {
  const { deck, slides, componentsBySlide, customBackgrounds } = bundle
  const surface = resolveSurface(undefined, deck.surface)
  const steps = slides
    .map((s, i) => stepHTML(s, componentsBySlide[s.id] ?? [], deck, i))
    .join('\n')
  const customCss = customBackgrounds
    .map((b) => `.${b.klass}{background:${b.style}}`)
    .join('\n')
  // Canned transition (spec §7.2): impress reads data-transition-duration; we also emit the chosen
  // name as a class for fidelity (a Bespoke generator would consume it; impress ignores it).
  const transition = deck.canned_transition || 'none'
  const duration = flightFor(transition).duration || 900
  const userCss = scopeCss(deck.custom_stylesheet || '')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>${esc(deck.title || 'Strut presentation')}</title>
<style>
  html,body{margin:0;height:100%;background:${surface};font-family:'Lato',sans-serif;}
  #impress{}
  .step{box-sizing:border-box;}
  .slideContainer{box-shadow:0 10px 60px rgba(0,0,0,.5);}
  .cmp-text{margin:0;}
  .fallback{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;padding:2rem;}
  .impress-not-supported .fallback{display:flex;}
  .impress-supported .fallback{display:none;}
  .hint{position:fixed;bottom:10px;left:0;right:0;text-align:center;color:rgba(255,255,255,.5);font-size:13px;}
${customCss}
${userCss}
</style>
</head>
<body class="impress-not-supported">
<div class="fallback">Your browser doesn't support CSS 3D transforms — open this in a modern browser.</div>
<div id="impress" class="strut-transition-${transition}" data-transition-duration="${duration}">
${steps}
  <div id="overview" class="step" data-x="0" data-y="0" data-scale="10"></div>
</div>
<div class="hint">Use the spacebar or arrow keys to navigate</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/impress.min.js"></script>
<script>impress().init();</script>
</body>
</html>`
}
