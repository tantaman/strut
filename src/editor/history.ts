// Undo/redo command history (spec §3.7). A single bounded (capacity 20) stack of
// `{ label, undo, redo }` commands, shared across the editor. Framework-agnostic so it can be
// driven from gesture handlers, menu actions, and the keyboard alike; React subscribes via
// `subscribe()` for enabling/disabling the toolbar buttons.
//
// Convention: a command's `redo()` IS the forward action. Call sites that have ALREADY applied an
// action (e.g. a finished drag) use `push(cmd)` to record it without re-running; menu actions can
// use `perform(cmd)` to run-and-record in one step. `batch()` collapses everything pushed during a
// callback into one atomic CombinedCommand (spec's `record(cb, name)`).

export interface Command {
  label: string
  undo: () => void
  redo: () => void
}

const CAP = 20

export class History {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private listeners = new Set<() => void>()
  private batching: Command[] | null = null

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    for (const fn of this.listeners) fn()
  }

  /** Record an already-applied command (does NOT run it). Clears the redo stack. */
  push = (cmd: Command): void => {
    if (this.batching) {
      this.batching.push(cmd)
      return
    }
    this.undoStack.push(cmd)
    if (this.undoStack.length > CAP) this.undoStack.shift()
    this.redoStack = []
    this.emit()
  }

  /** Run a command's forward action and record it. */
  perform = (cmd: Command): void => {
    cmd.redo()
    this.push(cmd)
  }

  /** Collapse every push during `fn` into one atomic command (multi-step undo). */
  batch = (label: string, fn: () => void): void => {
    if (this.batching) {
      fn() // already batching — just nest into the current collection
      return
    }
    const collected: Command[] = []
    this.batching = collected
    try {
      fn()
    } finally {
      this.batching = null
    }
    if (collected.length === 0) return
    this.push({
      label,
      undo: () => {
        for (let i = collected.length - 1; i >= 0; i--) collected[i].undo()
      },
      redo: () => {
        for (const c of collected) c.redo()
      },
    })
  }

  /** Drain this history's whole undo stack into ONE atomic command (and reset it), or null if empty. Unlike
   *  `batch` — which collects only SYNCHRONOUS pushes — this lets an ASYNC multi-step apply record each step
   *  into a throwaway History instance, then fold the lot into a single parent undo. The returned command's
   *  undo reverses the steps in reverse order; its redo replays them forward. */
  drain = (label: string): Command | null => {
    const collected = this.undoStack
    this.undoStack = []
    this.redoStack = []
    this.emit()
    if (collected.length === 0) return null
    return {
      label,
      undo: () => {
        for (let i = collected.length - 1; i >= 0; i--) collected[i].undo()
      },
      redo: () => {
        for (const c of collected) c.redo()
      },
    }
  }

  undo = (): void => {
    const cmd = this.undoStack.pop()
    if (!cmd) return
    cmd.undo()
    this.redoStack.push(cmd)
    this.emit()
  }

  redo = (): void => {
    const cmd = this.redoStack.pop()
    if (!cmd) return
    cmd.redo()
    this.undoStack.push(cmd)
    this.emit()
  }

  clear = (): void => {
    this.undoStack = []
    this.redoStack = []
    this.emit()
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }
  get canRedo(): boolean {
    return this.redoStack.length > 0
  }
  /** Label of the next undo/redo, for tooltips. */
  get undoLabel(): string | null {
    return this.undoStack.length
      ? this.undoStack[this.undoStack.length - 1].label
      : null
  }
  get redoLabel(): string | null {
    return this.redoStack.length
      ? this.redoStack[this.redoStack.length - 1].label
      : null
  }
}
