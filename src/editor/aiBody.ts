// One-undo rewrite of a slide's canonical primary text component. The model may author Markdown, but the
// mutation target is the same TipTap document that doc-first, precision, Present, and export consume.

import { markdownToDoc } from './aiGenerate'
import { primaryTextId } from '../../shared/app-def'
import type { SetTextContentArgs } from '../../shared/app-def'
import type { History } from './history'
import type { SlideDetail } from './deckDetail'
import type { AnyComponent } from './types'

export interface BodyMutate {
  setTextContent: (a: SetTextContentArgs) => unknown
}

/** Rewrite one slide's primary text layer as ONE undoable step. */
export function applyBodyEdit(
  slideId: string,
  markdown: string,
  ctx: {
    mutate: BodyMutate
    history: History
    slides: SlideDetail[]
    componentsBySlide: Readonly<Record<string, readonly AnyComponent[]>>
    /** Initial primary content for a slide created earlier in this same atomic AI turn. */
    createdPrimaryContent?: string
  },
  label = 'AI edit',
): boolean {
  const { mutate, history, slides, componentsBySlide, createdPrimaryContent } =
    ctx
  const slide = slides.find((candidate) => candidate.id === slideId)
  if (!slide && createdPrimaryContent === undefined) return false

  const componentId = slide?.body_component_id || primaryTextId(slideId)
  const component = (componentsBySlide[slideId] ?? []).find(
    (candidate) => candidate.id === componentId,
  )
  const before = component?.doc ?? createdPrimaryContent
  // A missing snapshot is not an empty document. Refuse the edit instead of manufacturing an unsafe
  // undo that would erase the author's primary content.
  if (before === undefined) return false
  const content = markdownToDoc(markdown)

  const write = (next: string) =>
    mutate.setTextContent({ id: componentId, content: next })
  const redo = () => write(content)
  const undo = () => write(before)
  redo()
  history.push({ label, redo, undo })
  return true
}
