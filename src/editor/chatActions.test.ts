// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { History } from './history'
import { applyThemePatch } from './aiTheme'
import { applyBodyEdit } from './aiBody'
import { dispatchAction } from './aiChatActions'
import type { DispatchCtx } from './aiChatActions'
import { uploadArtifact } from './upload'
import type { SetDeckThemeArgs, SetSlideDocArgs } from '../../shared/app-def'
import type { SlideDetail } from './deckDetail'

// The artifact build/upload pipeline is exercised by its own suite — here we just need it to succeed (or
// fail) deterministically so the add_artifact dispatch path is testable without sucrase/network.
vi.mock('./artifactBuild', () => ({
  buildArtifactModule: vi.fn(async (s: string) => `built:${s}`),
}))
vi.mock('./upload', () => ({
  uploadArtifact: vi.fn(async () => 'https://cdn.example/built.html'),
}))

// The two genuinely-new one-undo appliers (aiTheme / aiBody). Each captures the deck/slide's before-value,
// applies the change, and pushes exactly ONE reversible history command — the whole point of the Edit lane.

describe('applyThemePatch', () => {
  it('applies the patch and reverts to the captured before-values on undo (one entry)', () => {
    const calls: SetDeckThemeArgs[] = []
    const mutate = { setDeckTheme: (a: SetDeckThemeArgs) => calls.push(a) }
    const history = new History()
    const deck = { id: 'd', background: 'bg-default', heading_color: '' }

    applyThemePatch(
      { background: 'bg-custom-abc', heading_color: 'ff0000' },
      { mutate, history, deck },
      'AI theme',
    )

    // Applied once, with the new values.
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      id: 'd',
      background: 'bg-custom-abc',
      heading_color: 'ff0000',
    })
    expect(history.canUndo).toBe(true)
    expect(history.undoLabel).toBe('AI theme')

    history.undo()
    // Undo restores ONLY the touched columns to their captured before-values.
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({
      id: 'd',
      background: 'bg-default',
      heading_color: '',
    })
  })

  it('is a no-op for an empty patch', () => {
    const mutate = { setDeckTheme: vi.fn() }
    const history = new History()
    applyThemePatch({}, { mutate, history, deck: { id: 'd' } })
    expect(mutate.setDeckTheme).not.toHaveBeenCalled()
    expect(history.canUndo).toBe(false)
  })
})

describe('applyBodyEdit', () => {
  const slides = [{ id: 's1', doc: 'BEFORE_DOC' } as unknown as SlideDetail]

  it('swaps in the converted doc and restores the prior doc on undo', () => {
    const calls: SetSlideDocArgs[] = []
    const mutate = { setSlideDoc: (a: SetSlideDocArgs) => calls.push(a) }
    const history = new History()

    const ok = applyBodyEdit('s1', '# Tighter\n\n- a\n- b', {
      mutate,
      history,
      slides,
    })
    expect(ok).toBe(true)
    expect(calls).toHaveLength(1)
    // markdownToDoc produced a real (non-empty, JSON) doc that isn't the old value.
    expect(calls[0].id).toBe('s1')
    expect(calls[0].doc).not.toBe('BEFORE_DOC')
    expect(() => JSON.parse(calls[0].doc)).not.toThrow()

    history.undo()
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ id: 's1', doc: 'BEFORE_DOC' })
  })

  it('returns false (no mutation) when the target slide is gone', () => {
    const mutate = { setSlideDoc: vi.fn() }
    const history = new History()
    expect(applyBodyEdit('ghost', '# x', { mutate, history, slides })).toBe(
      false,
    )
    expect(mutate.setSlideDoc).not.toHaveBeenCalled()
    expect(history.canUndo).toBe(false)
  })
})

// ---- free-form component inserts (dispatchAction: add_web / add_artifact / add_image) --------------

/** A DispatchCtx with a spy `mutate`. Only the add-component + removeComponent mutators matter here; the
 *  type is a broad intersection so we cast the partial mock (its runtime shape is all the dispatcher uses). */
function makeCtx(
  mutate: Record<string, unknown>,
  activeSlideId: string | null = 's1',
): DispatchCtx {
  return {
    deckId: 'd',
    slides: [],
    deck: null,
    mutate: mutate as unknown as DispatchCtx['mutate'],
    history: new History(),
    activeSlideId,
  }
}

// A minimal fetch Response stand-in (env-independent — we only read .ok/.json/.status).
function okJson(data: unknown): Response {
  return { ok: true, status: 200, json: async () => data } as unknown as Response
}

describe('dispatchAction · add_web', () => {
  it('inserts a webframe on the active slide as one undo (undo removes it)', async () => {
    const added: Array<{ id: string; slideId: string; src: string }> = []
    const removed: Array<{ id: string }> = []
    const ctx = makeCtx({
      addWebframe: (a: { id: string; slideId: string; src: string }) =>
        added.push(a),
      removeComponent: (a: { id: string }) => removed.push(a),
    })

    const out = await dispatchAction(
      { kind: 'add_web', src: 'https://example.com' },
      ctx,
    )
    expect(out).toEqual({ ok: true, label: 'Add web frame' })
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ slideId: 's1', src: 'https://example.com' })
    expect(ctx.history.canUndo).toBe(true)

    ctx.history.undo()
    expect(removed).toEqual([{ id: added[0].id }])
  })

  it('fails with a friendly error when no slide is open', async () => {
    const out = await dispatchAction(
      { kind: 'add_web', src: 'https://example.com' },
      makeCtx({}, null),
    )
    expect(out.ok).toBe(false)
  })
})

describe('dispatchAction · add_artifact', () => {
  it('builds + uploads, then inserts with the built src', async () => {
    const added: Array<{ code: string; src: string; slideId: string }> = []
    const ctx = makeCtx({
      addArtifact: (a: { code: string; src: string; slideId: string }) =>
        added.push(a),
      removeComponent: vi.fn(),
    })

    const out = await dispatchAction(
      { kind: 'add_artifact', code: 'export default () => null' },
      ctx,
    )
    expect(out).toEqual({ ok: true, label: 'Add artifact' })
    expect(added[0]).toMatchObject({
      slideId: 's1',
      code: 'export default () => null',
      src: 'https://cdn.example/built.html',
    })
  })

  it('still inserts (empty src) when the build/upload fails, so the code isn’t lost', async () => {
    vi.mocked(uploadArtifact).mockRejectedValueOnce(new Error('offline'))
    const added: Array<{ code: string; src: string }> = []
    const ctx = makeCtx({
      addArtifact: (a: { code: string; src: string }) => added.push(a),
      removeComponent: vi.fn(),
    })

    const out = await dispatchAction(
      { kind: 'add_artifact', code: 'CODE' },
      ctx,
    )
    expect(out.ok).toBe(true)
    expect(added[0]).toMatchObject({ code: 'CODE', src: '' })
  })
})

describe('dispatchAction · add_image', () => {
  it('url mode uses the URL directly with no round-trip', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const added: Array<{ src: string; slideId: string }> = []
    const ctx = makeCtx({
      addImage: (a: { src: string; slideId: string }) => added.push(a),
      removeComponent: vi.fn(),
    })

    const out = await dispatchAction(
      { kind: 'add_image', source: 'url', value: 'https://img.example/x.jpg' },
      ctx,
    )
    expect(out.ok).toBe(true)
    expect(added[0]).toMatchObject({
      slideId: 's1',
      src: 'https://img.example/x.jpg',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('search mode resolves the first result from /api/image-search', async () => {
    const fetchMock = vi.fn(async () =>
      okJson({ results: ['https://img.example/a.jpg'] }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const added: Array<{ src: string }> = []
    const ctx = makeCtx({
      addImage: (a: { src: string }) => added.push(a),
      removeComponent: vi.fn(),
    })

    const out = await dispatchAction(
      { kind: 'add_image', source: 'search', value: 'cats' },
      ctx,
    )
    expect(out.ok).toBe(true)
    expect(added[0].src).toBe('https://img.example/a.jpg')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/image-search?q=cats',
      expect.anything(),
    )
    vi.unstubAllGlobals()
  })

  it('generate mode posts the prompt to /api/image and uses the returned url', async () => {
    const fetchMock = vi.fn(async () =>
      okJson({ url: 'https://cdn.example/gen.jpg' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const added: Array<{ src: string }> = []
    const ctx = makeCtx({
      addImage: (a: { src: string }) => added.push(a),
      removeComponent: vi.fn(),
    })

    const out = await dispatchAction(
      { kind: 'add_image', source: 'generate', value: 'a red bike' },
      ctx,
    )
    expect(out.ok).toBe(true)
    expect(added[0].src).toBe('https://cdn.example/gen.jpg')
    expect(fetchMock).toHaveBeenCalledWith('/api/image', expect.anything())
    vi.unstubAllGlobals()
  })

  it('surfaces a friendly error when a search returns nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okJson({ results: [] })),
    )
    const ctx = makeCtx({ addImage: vi.fn(), removeComponent: vi.fn() })
    const out = await dispatchAction(
      { kind: 'add_image', source: 'search', value: 'zzzz' },
      ctx,
    )
    expect(out.ok).toBe(false)
    vi.unstubAllGlobals()
  })
})
