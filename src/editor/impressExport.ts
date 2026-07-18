// Standalone impress.js export (spec §9.2 — "the critical contract"). Produces a single self-contained
// HTML string: one `.step` per slide, positioned with the same world math as Present mode (so a deck
// plays identically), then impress.js (CDN) reads the data-* attributes and flies the camera.

import { googleFontsHref, SLIDE_H, SLIDE_W } from '../config'
import { componentSize } from './render'
import { docToHtml, isDocEmpty } from './tiptapDoc'
import {
  backgroundImage,
  bodyStyleFor,
  composeBackground,
  cssHex,
  cssUrlValue,
  resolveBackground,
  resolveBackgroundImage,
  resolveSurface,
  resolveTextAlign,
  slideBodyVAlign,
  textTypeOf,
} from './types'
import type {
  AnyComponent,
  BackgroundImageSpec,
  BodyRegionStyle,
  DeckThemeFields,
} from './types'
import { flightFor } from './transitions'
import { scopeCss } from './css'
import type { DeckBundle } from './serialize'

// Overview (x,y) are in 240px "card" units; the world places full 1280px slides (matches play route).
const WORLD = SLIDE_W / 240
const deg = (rad: number) => (rad * 180) / Math.PI

// Markdown-mode surface styling — mirrors the `.strut-md` scope in src/strut.css so an exported deck
// renders markdown slides identically to the editor. Reads the same theme CSS vars (themeVarsCss),
// including the body-region pair (--strut-body-pad / --strut-type-scale) — keep both the rules here
// and the vars in themeVarsCss in step with their twins, or an exported deck partitions differently.
const STRUT_MD_CSS = `  .strut-md{box-sizing:border-box;width:100%;height:100%;padding:var(--strut-body-pad,64px 88px);display:var(--strut-body-display,block);flex-direction:column;justify-content:var(--strut-body-justify,safe center);overflow:hidden;font-family:var(--strut-body-font,'Lato',sans-serif);color:var(--strut-body-color,#111);text-align:var(--strut-text-align,left);line-height:1.35;font-size:calc(32px * var(--strut-type-scale,1));}
  .strut-md>*:first-child{margin-top:0;}
  .strut-md h1,.strut-md h2,.strut-md h3,.strut-md h4{font-family:var(--strut-heading-font,'Lato',sans-serif);color:var(--strut-heading-color,#111);line-height:1.1;margin:0 0 .4em;font-weight:700;text-indent:-.045em;}
  .strut-md h1{font-size:calc(88px * var(--strut-type-scale,1));}
  .strut-md h2{font-size:calc(64px * var(--strut-type-scale,1));}
  .strut-md h3{font-size:calc(48px * var(--strut-type-scale,1));}
  .strut-md h4{font-size:calc(38px * var(--strut-type-scale,1));}
  .strut-md p,.strut-md ul,.strut-md ol,.strut-md blockquote,.strut-md pre{margin:0 0 .6em;}
  .strut-md ul,.strut-md ol{padding-left:1.3em;list-style:revert;}
  .strut-md li{margin:.15em 0;}
  .strut-md a{color:inherit;text-decoration:underline;}
  .strut-md code{font-family:'JetBrains Mono',monospace;font-size:.8em;background:rgba(0,0,0,.06);padding:.1em .3em;border-radius:4px;}
  .strut-md pre{background:rgba(0,0,0,.06);padding:.7em 1em;border-radius:8px;overflow:auto;}
  .strut-md pre code{background:none;padding:0;}
  .strut-md blockquote{border-left:4px solid rgba(0,0,0,.18);padding-left:.8em;opacity:.85;}
  .strut-md img{max-width:100%;}
  .strut-md table{border-collapse:collapse;}
  .strut-md td,.strut-md th{border:1px solid rgba(0,0,0,.2);padding:.3em .6em;}`

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
    case 'text': {
      // '' color/font = inherit the deck theme default for this category via the CSS vars set on
      // the slide container (see themeVarsCss / stepHTML).
      const cat = textTypeOf(c)
      const color = c.color
        ? cssHex(c.color, '111111')
        : `var(--strut-${cat}-color, #111111)`
      const font = c.font_family
        ? `'${esc(c.font_family)}',sans-serif`
        : `var(--strut-${cat}-font, 'Lato',sans-serif)`
      extra = `font-size:${c.size ?? 72}px;color:${color};font-family:${font};line-height:1.1;white-space:pre-wrap;max-width:1100px;`
      body = `<div class="cmp-text">${c.text && c.text.length ? c.text : 'Text'}</div>`
      break
    }
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
    case 'artifact':
      // Sandboxed iframe pointing at the built artifact URL (external). Same isolation as the live app:
      // allow-scripts only — NO allow-same-origin — so it runs in an opaque origin. Empty until built.
      body = c.src
        ? `<iframe src="${esc(c.src)}" sandbox="allow-scripts" referrerpolicy="no-referrer" style="width:100%;height:100%;border:0;background:#fff"></iframe>`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f4f4f5;color:#71717a;font:600 14px system-ui">▶ runnable</div>`
      break
  }
  const sizeStyle = c.kind === 'text' ? '' : `width:${w}px;height:${h}px;`
  return `<div class="cmp" style="position:absolute;left:${c.x}px;top:${c.y}px;${sizeStyle}transform:${transform};transform-origin:top left;${extra}">${body}</div>`
}

function backgroundImageLayerHTML(image: BackgroundImageSpec): string {
  const outer: string[] = [
    'position:absolute',
    'top:0',
    'bottom:0',
    'overflow:hidden',
    'pointer-events:none',
  ]
  if (image.fade) outer.push('opacity:.48')
  if (image.layout === 'left') outer.push('left:0', 'width:50%')
  else if (image.layout === 'right') outer.push('right:0', 'width:50%')
  else outer.push('left:0', 'right:0')
  if (image.mask) {
    const mask =
      image.layout === 'left'
        ? 'linear-gradient(90deg, #000 0%, #000 72%, transparent 100%)'
        : image.layout === 'right'
          ? 'linear-gradient(270deg, #000 0%, #000 72%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)'
    outer.push(`mask-image:${mask}`, `-webkit-mask-image:${mask}`)
  }
  const inner: string[] = [
    'position:absolute',
    `inset:${image.blur ? '-14px' : '0'}`,
    `background-image:${cssUrlValue(image.src)}`,
    'background-position:center',
    'background-size:cover',
    'background-repeat:no-repeat',
  ]
  if (image.blur) inner.push('filter:blur(10px)')
  return `<div class="slide-bg-img" style="${esc(outer.join(';'))}"><div class="slide-bg-img__media" style="${esc(inner.join(';'))}"></div></div>`
}

/** The deck text theme as CSS custom-property declarations for the slide container, so a text
 *  component with '' color/font resolves `var(--strut-<category>-…)` in the standalone export.
 *  `align` is the slide-resolved alignment (drives markdown-mode text-align); `style` is the
 *  slide-resolved body style (its layout cell's inset + type scale + display).
 *
 *  The string twin of `themeVars` in render.tsx — it must emit the SAME set of var names, or an
 *  exported deck renders differently from the app. `bodyRegion.test.ts` pins the two together. */
function themeVarsCss(
  theme: DeckThemeFields,
  align: string,
  style: BodyRegionStyle,
  valign: string | null | undefined,
): string {
  const font = (f: string | null | undefined) =>
    `'${esc((f || 'Lato').replace(/'/g, ''))}',sans-serif`
  const r = style
  const va = slideBodyVAlign(valign)
  return (
    `--strut-heading-color:${cssHex(theme.heading_color ?? '', '111111')};` +
    `--strut-heading-font:${font(theme.heading_font)};` +
    `--strut-body-color:${cssHex(theme.body_color ?? '', '111111')};` +
    `--strut-body-font:${font(theme.body_font)};` +
    `--strut-text-align:${align};` +
    `--strut-body-pad:${r.pad};` +
    `--strut-type-scale:${r.scale};` +
    `--strut-body-display:${va.flex ? 'flex' : r.display};` +
    `--strut-body-justify:${va.justify};`
  )
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
  // z is in the same world units as x/y (a card is 240; WORLD maps that to px), so it must get the same
  // WORLD scale — otherwise impress.js flies to a different depth than the in-app camera renders.
  if (slide.z) attrs.push(`data-z="${Math.round(slide.z * WORLD)}"`)
  if (slide.rotate_x)
    attrs.push(`data-rotate-x="${deg(slide.rotate_x).toFixed(2)}"`)
  if (slide.rotate_y)
    attrs.push(`data-rotate-y="${deg(slide.rotate_y).toFixed(2)}"`)
  if (slide.rotate_z)
    attrs.push(`data-rotate-z="${deg(slide.rotate_z).toFixed(2)}"`)
  const scale = (slide.imp_scale || 3) / 3
  if (scale !== 1) attrs.push(`data-scale="${scale}"`)

  const bg = resolveBackground(slide.background, deck.background)
  const bgImage = resolveBackgroundImage(slide.background, deck.background)
  const surface = composeBackground(
    resolveSurface(slide.surface, deck.surface),
    backgroundImage(slide.surface, deck.surface),
  )
  const align = resolveTextAlign(slide.text_align, deck.text_align)
  // The body's cell-0 style — a real layout tiling, else the legacy single region (auto-derived from
  // the half-bleed image above). Exactly what themeVars resolves in-app, so exports match.
  const bodyStyle = bodyStyleFor(slide, deck)
  // Both layers, composited like every app surface: the markdown Body underlay (`.strut-md`, same
  // doc→HTML renderer) with the positioned Objects painted on top (absolute → above the static body).
  // Each is emitted only when it has content, so single-layer slides export exactly as before.
  const body = isDocEmpty(slide.doc)
    ? ''
    : `      <div class="strut-md">${docToHtml(slide.doc)}</div>`
  const objects = [...components]
    .sort((a, b) => a.z_order - b.z_order)
    .map((c) => '      ' + componentHTML(c))
    .join('\n')
  const bgLayer = bgImage ? '      ' + backgroundImageLayerHTML(bgImage) : ''
  const inner = [bgLayer, body, objects].filter(Boolean).join('\n')
  return `  <div class="step" data-state="strut-slide-${index}" data-surface="${esc(surface)}" ${attrs.join(' ')}>
    <div class="slideContainer strut-surface" style="width:${SLIDE_W}px;height:${SLIDE_H}px;background:${bg};overflow:hidden;position:relative;${themeVarsCss(deck, align, bodyStyle, slide.valign)}">
${inner}
    </div>
  </div>`
}

export function toImpressHTML(bundle: DeckBundle): string {
  const { deck, slides, componentsBySlide, customBackgrounds } = bundle
  const surfaceColor = resolveSurface(undefined, deck.surface)
  const surface = composeBackground(
    surfaceColor,
    backgroundImage(undefined, deck.surface),
  )
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${googleFontsHref()}">
<style>
  html,body{margin:0;height:100%;background:${surfaceColor};font-family:'Lato',sans-serif;transition:background ${duration}ms ${flightFor(transition).easing};}
  #impress{}
  .step{box-sizing:border-box;}
  .slideContainer{box-shadow:0 10px 60px rgba(0,0,0,.5);}
  .cmp-text{margin:0;}
${STRUT_MD_CSS}
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
<div id="impress" class="strut-transition-${transition}" data-transition-duration="${duration}" data-surface="${esc(surface)}">
${steps}
  <div id="overview" class="step" data-x="0" data-y="0" data-scale="10"></div>
</div>
<div class="hint">Use the spacebar or arrow keys to navigate</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/impress.min.js"></script>
<script>
(function(){
  var root = document.getElementById('impress');
  var fallbackSurface = root ? (root.getAttribute('data-surface') || '') : '';
  function applySurface(step){
    document.body.style.background = step ? (step.getAttribute('data-surface') || fallbackSurface) : fallbackSurface;
  }
  document.addEventListener('impress:stepenter', function(e){ applySurface(e.target); });
  impress().init();
  window.setTimeout(function(){
    applySurface(document.querySelector('.step.active') || document.querySelector('.step'));
  }, 0);
})();
</script>
</body>
</html>`
}
