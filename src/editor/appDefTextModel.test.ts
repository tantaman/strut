import { describe, expect, it } from 'vitest'
import { isoTx } from '@rindle/client'
import { mutators, primaryTextId } from '../../shared/app-def'
import { deckDetailQuery } from '../../shared/queries'

const ctx = { user: 'user-1' }

describe('canonical text component mutations', () => {
  it('does not expose legacy slide-body mutators', () => {
    expect(mutators).not.toHaveProperty('setSlideMarkdown')
    expect(mutators).not.toHaveProperty('setSlideDoc')
    expect(mutators).not.toHaveProperty('setSlideCells')
    expect(mutators).not.toHaveProperty('setSlideMode')
  })

  it('projects only canonical deck and slide fields', () => {
    const ast = JSON.stringify(deckDetailQuery({ deckId: 'deck-1' }).ast())

    expect(ast).toContain('"body_component_id"')
    expect(ast).toContain('"components"')
    expect(ast).not.toContain('"default_slide_mode"')
    expect(ast).not.toContain('"render_mode"')
    expect(ast).not.toContain('"markdown"')
    expect(ast).not.toContain('"doc"')
    expect(ast).not.toContain('"cells"')
    expect(ast).not.toContain('"body_region"')
    expect(ast).not.toContain('"layout"')
    expect(ast).not.toContain('"pad"')
    expect(ast).not.toContain('"valign"')
    expect(ast).not.toContain('"alias":"body"')
  })

  it('creates a deterministic full-slide primary text component with its slide', () => {
    const ops = [
      ...mutators.addSlide(
        isoTx,
        {
          id: 'slide-1',
          deckId: 'deck-1',
          sort: 'a0',
          x: 10,
          y: 20,
          content: '{"type":"doc","content":[]}',
          now: 123,
        },
        ctx,
      ),
    ]

    expect(primaryTextId('slide-1')).toBe('slide-1:body')
    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({
      kind: 'insert',
      table: 'slide',
      row: { id: 'slide-1', body_component_id: 'slide-1:body' },
    })
    expect(ops[1]).toMatchObject({
      kind: 'insert',
      table: 'component',
      row: {
        id: 'slide-1:body',
        slide_id: 'slide-1',
        type: 'text',
        x: 0,
        y: 0,
        z_order: 0,
        scale_w: 1280,
        scale_h: 720,
        content: '{"type":"doc","content":[]}',
      },
    })
  })

  it('updates text content without rewriting style props', () => {
    const [op] = [
      ...mutators.setTextContent(
        isoTx,
        { id: 'text-1', content: 'next-doc' },
        ctx,
      ),
    ]

    expect(op).toEqual({
      kind: 'update',
      table: 'component',
      row: { id: 'text-1', content: 'next-doc' },
    })
  })
})
