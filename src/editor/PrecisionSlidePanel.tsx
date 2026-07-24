import { useEffect, useRef, useState } from 'react'
import { newId } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { TokenColorField } from './ColorField'
import type { DeckRoot, SlideDetail } from './deckDetail'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import {
  BACKGROUND_IMAGE_LAYOUTS,
  BACKGROUND_SWATCHES,
  makeBackgroundImageToken,
  parseBackgroundImageToken,
  resolveBackground,
  resolveBackgroundImage,
  resolveLayout,
  resolveSlidePad,
  resolveSlideValign,
  resolveSurface,
  SLIDE_LAYOUTS,
  SLIDE_PADS,
  SLIDE_VALIGNS,
  SURFACE_SWATCHES,
  TEXT_ALIGNS,
} from './types'
import type {
  BackgroundImageLayout,
  SlideLayout,
  SlidePad,
  SlideValign,
  TextAlign,
} from './types'
import { uploadImage } from './upload'

type SlideThemeField =
  | 'background'
  | 'surface'
  | 'layout'
  | 'pad'
  | 'valign'
  | 'text_align'

const LAYOUT_LABELS: Record<SlideLayout, string> = {
  '': 'Full',
  'cols-2': 'Columns',
  'rows-2': 'Rows',
  tri: 'Three',
  'grid-4': 'Grid',
  'split-l': 'Split',
}

const PAD_LABELS: Record<SlidePad, string> = {
  '': 'Comfortable',
  compact: 'Compact',
  edge: 'Edge',
}

const VALIGN_LABELS: Record<SlideValign, string> = {
  top: 'Top',
  middle: 'Middle',
  bottom: 'Bottom',
}

const ALIGN_LABELS: Record<TextAlign, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
}

/**
 * The contextual precision workspace's no-selection state. It deliberately edits only the active
 * slide's overrides: deck-wide styling remains owned by the ambient Design lane in Header/Chat.
 */
export function PrecisionSlidePanel({
  slide,
  deck,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  const fileRef = useRef<HTMLInputElement>(null)
  const deckBackground = deck?.background ?? undefined
  const deckSurface = deck?.surface ?? undefined
  const effectiveImage = resolveBackgroundImage(
    slide.background,
    deckBackground,
  )
  const explicitImage = parseBackgroundImageToken(slide.background)
  const [imageUrl, setImageUrl] = useState(effectiveImage?.src ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setImageUrl(effectiveImage?.src ?? '')
    setUploadError(null)
  }, [effectiveImage?.src, slide.id])

  if (editor.selected.size !== 0) return null

  const readField = (field: SlideThemeField): string => {
    const value = slide[field]
    return typeof value === 'string' ? value : ''
  }

  /** Apply one slide column and put exactly one command on the shared undo stack. */
  const commitField = (
    field: SlideThemeField,
    next: string,
    label: string,
  ): boolean => {
    const before = readField(field)
    if (before === next) return false
    const apply = (value: string) =>
      mutate.setSlideTheme({
        id: slide.id,
        now: Date.now(),
        [field]: value,
      })
    apply(next)
    history.push({
      label,
      redo: () => apply(next),
      undo: () => apply(before),
    })
    return true
  }

  const commitCustomColor = (field: 'background' | 'surface', hex: string) => {
    if (!deck) return
    const bare = hex.replace(/^#+/, '').toLowerCase()
    if (!/^[0-9a-f]{6}$/.test(bare)) return
    const token = `bg-custom-${bare}`
    if (readField(field) === token) return
    // This mirrors the established Design/AI lane: the reusable CSS token is harmless metadata if
    // undo later makes it unused; the visible slide change itself remains one atomic undo command.
    mutate.mintCustomColor({
      id: newId(),
      deckId: deck.id,
      klass: token,
      style: `.${token}{background:#${bare}}`,
    })
    commitField(
      field,
      token,
      field === 'background' ? 'Slide background' : 'View surface',
    )
  }

  const commitImage = (
    patch: Partial<{
      src: string
      layout: BackgroundImageLayout
      fade: boolean
      blur: boolean
      mask: boolean
    }>,
    label: string,
  ) => {
    const src = (patch.src ?? effectiveImage?.src ?? imageUrl).trim()
    if (!src) return
    const next = makeBackgroundImageToken(src, {
      layout: patch.layout ?? effectiveImage?.layout ?? 'full',
      fade: patch.fade ?? effectiveImage?.fade ?? false,
      blur: patch.blur ?? effectiveImage?.blur ?? false,
      mask: patch.mask ?? effectiveImage?.mask ?? false,
    })
    setImageUrl(src)
    setUploadError(null)
    commitField('background', next, label)
  }

  const applyImageUrl = () => {
    const src = imageUrl.trim()
    if (src) commitImage({ src }, 'Slide background image')
  }

  const pickImage = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const src = await uploadImage(file)
      commitImage({ src }, 'Slide background image')
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const currentLayout = resolveLayout(slide.layout)
  const currentPad = resolveSlidePad(slide.pad)
  const currentValign = resolveSlideValign(slide)
  const storedAlign = readField('text_align')
  const hasImage = !!(effectiveImage?.src || imageUrl.trim())

  return (
    <aside
      className="precision-panel"
      aria-label="Slide properties"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="precision-panel__header">Slide</div>

      <section className="precision-panel__section">
        <h3 className="precision-panel__section-title">Background</h3>
        <div className="precision-panel__row">
          <span className="precision-panel__label">Color</span>
          <TokenColorField
            label="Slide background color"
            current={slide.background}
            swatches={BACKGROUND_SWATCHES}
            resolve={(value) => resolveBackground(value, deckBackground)}
            onPick={(value) =>
              commitField('background', value, 'Slide background')
            }
            onCustom={(hex) => commitCustomColor('background', hex)}
            allowTransparent
            imageAction={{
              title: 'Use a background image',
              active: !!explicitImage,
              onSelect: () => fileRef.current?.click(),
            }}
            defaultToken=""
            defaultTitle="inherit deck background"
            defaultGlyph="D"
          />
        </div>

        <div className="precision-panel__image">
          <label className="precision-panel__field">
            <span className="precision-panel__label">Reference</span>
            <input
              className="precision-panel__input"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={imageUrl}
              aria-label="Background image URL"
              onChange={(event) => setImageUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyImageUrl()
                }
                if (event.key === 'Escape') {
                  setImageUrl(effectiveImage?.src ?? '')
                  setUploadError(null)
                }
              }}
            />
          </label>
          <div className="precision-panel__actions">
            <button
              type="button"
              className="precision-panel__action"
              disabled={!imageUrl.trim()}
              onClick={applyImageUrl}
            >
              Apply
            </button>
            <button
              type="button"
              className="precision-panel__action"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input
              ref={fileRef}
              className="precision-panel__file"
              type="file"
              accept="image/*"
              aria-label="Upload background image"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void pickImage(file)
                event.currentTarget.value = ''
              }}
            />
            <button
              type="button"
              className="precision-panel__action"
              disabled={!slide.background}
              onClick={() =>
                commitField('background', '', 'Inherit deck background')
              }
            >
              Use deck
            </button>
          </div>

          <ChoiceGroup
            label="Background image placement"
            values={BACKGROUND_IMAGE_LAYOUTS}
            active={effectiveImage?.layout ?? 'full'}
            disabled={!hasImage}
            labelFor={(value) =>
              value === 'full' ? 'Full' : value === 'left' ? 'Left' : 'Right'
            }
            onChange={(layout) =>
              commitImage({ layout }, 'Background image placement')
            }
          />

          <div
            className="precision-panel__checks"
            role="group"
            aria-label="Background image effects"
          >
            {(['fade', 'blur', 'mask'] as const).map((effect) => (
              <label key={effect} className="precision-panel__check">
                <input
                  type="checkbox"
                  disabled={!hasImage}
                  checked={!!effectiveImage?.[effect]}
                  onChange={(event) =>
                    commitImage(
                      { [effect]: event.target.checked },
                      `Background image ${effect}`,
                    )
                  }
                />
                <span>{effect[0].toUpperCase() + effect.slice(1)}</span>
              </label>
            ))}
          </div>
          {uploadError && (
            <div className="precision-panel__error" role="alert">
              {uploadError}
            </div>
          )}
        </div>
      </section>

      <section className="precision-panel__section">
        <h3 className="precision-panel__section-title">Canvas</h3>
        <div className="precision-panel__row">
          <span className="precision-panel__label">View surface</span>
          <TokenColorField
            label="View surface color"
            current={slide.surface}
            swatches={SURFACE_SWATCHES}
            resolve={(value) => resolveSurface(value, deckSurface)}
            onPick={(value) => commitField('surface', value, 'View surface')}
            onCustom={(hex) => commitCustomColor('surface', hex)}
            defaultToken=""
            defaultTitle="inherit deck surface"
            defaultGlyph="D"
          />
        </div>
      </section>

      <section className="precision-panel__section">
        <h3 className="precision-panel__section-title">Layout</h3>
        <ChoiceGroup
          label="Slide layout"
          values={SLIDE_LAYOUTS}
          active={currentLayout}
          labelFor={(value) => LAYOUT_LABELS[value]}
          onChange={(layout) => commitField('layout', layout, 'Change layout')}
        />
      </section>

      <section className="precision-panel__section">
        <h3 className="precision-panel__section-title">Density</h3>
        <ChoiceGroup
          label="Slide content density"
          values={SLIDE_PADS}
          active={currentPad}
          labelFor={(value) => PAD_LABELS[value]}
          onChange={(pad) => commitField('pad', pad, 'Change padding')}
        />
      </section>

      <section className="precision-panel__section">
        <h3 className="precision-panel__section-title">Vertical alignment</h3>
        <ChoiceGroup
          label="Vertical content alignment"
          values={SLIDE_VALIGNS}
          active={currentValign}
          labelFor={(value) => VALIGN_LABELS[value]}
          onChange={(valign) =>
            commitField('valign', valign, 'Change vertical alignment')
          }
        />
      </section>

      <section className="precision-panel__section">
        <h3 className="precision-panel__section-title">Horizontal alignment</h3>
        <div
          className="precision-panel__seg"
          role="group"
          aria-label="Horizontal text alignment"
        >
          <button
            type="button"
            className={
              'precision-panel__choice' +
              (storedAlign === '' ? ' is-active' : '')
            }
            aria-pressed={storedAlign === ''}
            onClick={() =>
              commitField('text_align', '', 'Inherit text alignment')
            }
          >
            Deck
          </button>
          {TEXT_ALIGNS.map((align) => (
            <button
              key={align}
              type="button"
              className={
                'precision-panel__choice' +
                (storedAlign === align ? ' is-active' : '')
              }
              aria-pressed={storedAlign === align}
              onClick={() =>
                commitField('text_align', align, 'Change horizontal alignment')
              }
            >
              {ALIGN_LABELS[align]}
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}

function ChoiceGroup<T extends string>({
  label,
  values,
  active,
  disabled = false,
  labelFor,
  onChange,
}: {
  label: string
  values: readonly T[]
  active: T
  disabled?: boolean
  labelFor: (value: T) => string
  onChange: (value: T) => void
}) {
  return (
    <div className="precision-panel__seg" role="group" aria-label={label}>
      {values.map((value) => (
        <button
          key={value || '__default__'}
          type="button"
          className={
            'precision-panel__choice' + (active === value ? ' is-active' : '')
          }
          disabled={disabled}
          aria-pressed={active === value}
          onClick={() => onChange(value)}
        >
          {labelFor(value)}
        </button>
      ))}
    </div>
  )
}
