import { describe, expect, it, vi } from 'vitest'
import { History } from './history'

function command(label: string, undo = vi.fn(), redo = vi.fn()) {
  return { label, undo, redo }
}

describe('History revisions', () => {
  it('invalidates an async checkpoint when a later command is recorded', () => {
    const history = new History()
    const sentAt = history.revision

    history.push(command('Manual edit'))

    expect(history.isCurrent(sentAt)).toBe(false)
  })

  it('undoes the intended current command when its revision still matches', () => {
    const undo = vi.fn()
    const history = new History()
    history.push(command('AI edit', undo))
    const appliedAt = history.revision

    expect(history.undoIfCurrent(appliedAt)).toBe(true)
    expect(undo).toHaveBeenCalledOnce()
  })

  it('never lets an old affordance undo a later manual command', () => {
    const undoAI = vi.fn()
    const undoManual = vi.fn()
    const history = new History()
    history.push(command('AI edit', undoAI))
    const appliedAt = history.revision
    history.push(command('Manual edit', undoManual))

    expect(history.undoIfCurrent(appliedAt)).toBe(false)
    expect(history.undoLabel).toBe('Manual edit')
    expect(undoAI).not.toHaveBeenCalled()
    expect(undoManual).not.toHaveBeenCalled()
  })
})
