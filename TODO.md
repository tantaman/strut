# TODO

## Data-Loader

wrapper.ts for wa-sqlite -- our queue should understand if someone is already resolving a submitted query. If so, return that promise instead.

Althrough if there is a write going on in between them and us... we should not us them since the write could invalidate us.

How does `dataLoader` collect all the things in a tick? Can we just do the same and collapse the tick?
https://github.com/graphql/dataloader

## Editor

Strut1.0 like experience with Lexical?
https://github.com/facebook/lexical

## AppState bindings

- Can we get away with never having to bind to `appState.current_deck_id`?
- What about other ephermals? <- no on this

Track down all uses of `current_deck_id` and decide.
Audit `AppState` usage in general.

## Export

Export sql for deck for user to export their data.

## Defensive

Better defensive primitives for `queries` in cases where null is returned rather than empty array.
Shouldn't it always be at least an empty array?

---

# Done

~~## UseQuery

- PostProcess against full dataset
- Types in `queries.ts` rather than at callsite~~
