# Data-Loader

wrapper.ts for wa-sqlite -- our queue should understand if someone is already resolving a submitted query. If so, return that promise instead.

Althrough if there is a write going on in between them and us... we should not us them since the write could invalidate us.

How does `dataLoader` collect all the things in a tick? Can we just do the same and collapse the tick?
https://github.com/graphql/dataloader

# UseQuery

- PostProcess against full dataset
- Types in `queries.ts` rather than at callsite
