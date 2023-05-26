- paginated slide well
  - only what is visible?
- aggregate query? memo?
- delete text box if all text removed from it

- schema file -> ts definitions.

  - drizzle?

- force disconnect on schema update till both sides agree

- test that our de-duplicating of queries works as expected. I.e., 100 components all running
  the same query all await on a single query rather than running 100 queries.
