# Strut's one Rindle topology: a `rindle-replicator` write-master and one `rindled`
# read-follower. `followers = 1` is the smallest local pair; raising it scales reads without
# changing the app's bindings.
#
# `rindle dev` renders and supervises the pair plus the stable local fleet edge, then launches the
# web tier with one RINDLE_URL + RINDLE_DATABASE_TOKEN binding derived from this same file.
# `rindle deploy` uses it with the committed `.rindle/cloud.json` binding for the managed tier.
{
  profile = "replicated",
  app = "strut",
  followers = 1,
}
