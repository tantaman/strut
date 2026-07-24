// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { systemPrompt } from '../../server/chatAct'
import type { SetTextContentArgs } from '../../shared/app-def'
import {
  buildDigest,
  primarySlideText,
  slideGroundingText,
  slideText,
} from './aiArrange'
import { applyBodyEdit } from './aiBody'
import type { SlideDetail } from './deckDetail'
import { History } from './history'
import type { AnyComponent } from './types'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

function textComponent(
  id: string,
  text: string,
  z_order: number,
): AnyComponent {
  return {
    id,
    slide_id: 's1',
    kind: 'text',
    doc: doc(text),
    size: 32,
    color: '',
    font_family: '',
    z_order,
    x: 0,
    y: 0,
    scale_x: 1,
    scale_y: 1,
    scale_w: 400,
    scale_h: 160,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: '',
  }
}

const slide = {
  id: 's1',
  body_component_id: 's1:body',
} as SlideDetail
const components = [
  textComponent('caption', 'Supporting metric', 2),
  textComponent('s1:body', 'Primary story', 0),
]

describe('canonical text-component AI grounding', () => {
  it('grounds every text layer in spatial order', () => {
    expect(slideText(components)).toBe('Primary story Supporting metric')
    expect(slideGroundingText(components)).toBe(
      'Primary story\nSupporting metric',
    )
    expect(buildDigest([slide], { s1: components })[0].text).toBe(
      'Primary story Supporting metric',
    )
  })

  it('grounds set_body in only the primary document it can replace', () => {
    expect(primarySlideText(slide, components)).toBe('Primary story')
  })

  it('describes set_body as the primary component, not a legacy cell model', () => {
    const prompt = systemPrompt(['Inter'])
    expect(prompt).toContain('primary rich-text layer')
    expect(prompt).toContain(
      'Positioned text and media layers remain untouched',
    )
    expect(prompt).not.toContain('Cell 1')
    expect(prompt).not.toContain('populated cells')
  })
})

describe('primary-component set_body fidelity', () => {
  it('rewrites only the primary component and restores it as one undo', () => {
    const calls: SetTextContentArgs[] = []
    const history = new History()

    expect(
      applyBodyEdit('s1', '# Revised primary', {
        mutate: { setTextContent: (args) => calls.push(args) },
        history,
        slides: [slide],
        componentsBySlide: { s1: components },
      }),
    ).toBe(true)

    expect(calls).toHaveLength(1)
    expect(calls[0].id).toBe('s1:body')
    expect(calls[0].content).not.toBe(components[1].doc)
    expect(history.undoLabel).toBe('AI edit')

    history.undo()
    expect(calls[1]).toEqual({ id: 's1:body', content: components[1].doc })
    expect(history.canUndo).toBe(false)
  })

  it('refuses to invent an empty undo snapshot when the primary row is unavailable', () => {
    const setTextContent = vi.fn()
    const history = new History()

    expect(
      applyBodyEdit('s1', '# Revised primary', {
        mutate: { setTextContent },
        history,
        slides: [slide],
        componentsBySlide: {},
      }),
    ).toBe(false)
    expect(setTextContent).not.toHaveBeenCalled()
    expect(history.canUndo).toBe(false)
  })
})
