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

## Suspense

## Long lived query cache

So components can go thru remount cycle without flickering. Would need to return previously resolved promise
so suspense can handl it correctly.

## sqlite-api.js:91 unknown binding converted to null {slide_id: '637158ef3641244f'}

^-- add query text to msg in our fork

## Transaction Support

via vlcn.io/value

## Try new official WASM

multi tab.
Would need to comlink it...
Could rm the serializer
But would need to batch via `DataLoader` or some such

## TX Support

Problematic with serial+async nature or wa-sqlite.

It can use the current zone to fine the current statement queue.

## Move AppState to Context API?

AppState is mutable and we currently require components to bind to adjustments in it...

Can react context solve this problem? So we just bind to app state once (in ctx provider) rather than in every component that uses it?

If you do that Ctx should move out of `AppState` since everyone just uses `AppState` really only for that value.

## RM layerx layery usage?

## Check that rx/repl functions exists before call in trig

short circuit and for sql? Use a `WHEN` statement
https://sqlite.org/lang_createtrigger.html

```sql
CREATE TRIGGER ai AFTER INSERT ON foo WHEN EXISTS (SELECT 1 FROM pragma_function_list WHERE name = 'crsql_siteid') BEGIN
  INSERT INTO bar VALUES (crsql_siteid());
END;
```

^-- apparently still fails.

We can expose a cb registrar from `crsqlite` itself that knows how to check for
fn existence... `crsqlite` should always be in scope.

Or crsqlite fn that invokes a fn if that fn exists?

Or just expose `update_hook` ? Well we need `update_hook` to collect tables and `commit_hook` to release the notifications after tx complete.

## Drop tbls + drop clocks

Drop tables doesn't remove clock tables.. so we need a convenience for dropping a crr.

## Text Toolbar

https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/ToolbarPlugin/index.tsx#L403-L428

---

# Low Pri

## Resolve in batch

Maybe. Queries are serialized and resolve in turn thus causing components with multiple `useQuery` calls to render multiple times.
Although this should be fine since React should technically collapse re-renders that need collapsing?

---

# Done

~~## UseQuery

- PostProcess against full dataset
- Types in `queries.ts` rather than at callsite~~
