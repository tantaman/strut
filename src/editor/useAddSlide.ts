// Insert a blank slide at a given index — the one implementation behind every "+" in the editor (the
// well's gap inserters and its append button, Doc mode's seams). Extracted from SlideWell so a second
// surface can offer the same affordance without forking the ordering/placement rules.
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
export function useAddSlide(
  slides: SlideDetail[],
  deck: { default_slide_mode?: string | null } | null,
): (at: number) => string {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  const defaultMode = deck?.default_slide_mode

  return useCallback(
    (at: number) => {
      const slideAt = (i: number): SlideDetail | undefined =>
        i >= 0 && i < slides.length ? slides[i] : undefined
      const before = slideAt(at - 1)
      const after = slideAt(at)
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
        // New slides inherit the deck's default render mode (spec: deck-level markdown default).
        render_mode: defaultMode === 'markdown' ? 'markdown' : '',
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
    [slides, defaultMode, editor, mutate, history],
  )
}
