// Insert a blank slide at a given index — the one implementation behind every "+" in the editor (the
// well's gap inserters, its append button, and the scrolling deck's seams). Extracted from SlideWell so
// each quiet affordance shares the same ordering and placement rules.
//
// The fractional sort key falls between the neighbors; the 3-D overview position is placed near them too
// (midpoint when inserting between, one gap past the end when appending) so a slide added from a
// sequential surface doesn't land on top of another in the spatial one.

import { useCallback } from 'react'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keyBetween } from '../lib/order'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import type { AddSlideArgs } from '../../shared/app-def'
import type { SlideDetail } from './deckDetail'

/** Returns `addSlideAt(at)` — inserts a blank slide so it lands at index `at` (0 = before the first,
 *  slides.length = append), makes it active, and pushes one undo step. Returns the new slide's id. */
export function useAddSlide(slides: SlideDetail[]): (at: number) => string {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  return useCallback(
    (at: number) => {
      const slideAt = (i: number): SlideDetail | undefined =>
        i >= 0 && i < slides.length ? slides[i] : undefined
      const before = slideAt(at - 1)
      const after = slideAt(at)
      // Continue the neighbor's FRAME (layout tiling / density / alignment) instead of resetting to
      // defaults — so a run of similar slides doesn't mean re-picking the same settings each time. Prefer
      // the slide above the insertion point (the one you were just working under), else the one below for
      // an insert-at-top. Only the frame is carried; content (doc/cells) always starts empty.
      const src = before ?? after
      const id = newId()
      const between = (
        b: number | undefined,
        a: number | undefined,
        fallback: number,
      ) =>
        b != null && a != null
          ? Math.round((b + a) / 2)
          : b != null
            ? b + OVERVIEW_CARD_GAP
            : a != null
              ? a - OVERVIEW_CARD_GAP
              : fallback
      const args: AddSlideArgs = {
        id,
        deckId: editor.deckId,
        sort: keyBetween(before?.sort, after?.sort),
        x: between(before?.x, after?.x, 0),
        y: between(before?.y, after?.y, 0),
        // The single editor is body-first. This persisted value keeps new data legible to older readers;
        // current Strut renders body and positioned objects together regardless of the compatibility flag.
        render_mode: 'markdown',
        // …and the neighbor's frame, so the new slide picks up where you left off.
        layout: src?.layout ?? '',
        pad: src?.pad ?? '',
        valign: src?.valign ?? '',
        text_align: src?.text_align ?? '',
        now: Date.now(),
      }
      mutate.addSlide(args)
      editor.setActiveSlide(id)
      history.push({
        label: 'Add slide',
        redo: () => mutate.addSlide(args),
        undo: () => mutate.deleteSlide({ id, componentIds: [] }),
      })
      return id
    },
    [slides, editor, mutate, history],
  )
}
