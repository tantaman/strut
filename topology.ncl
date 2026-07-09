# Strut's Rindle topology — one write-owning `rindled` (Shape A / the `dev` profile).
#
# A topology is a plain record of inputs; `rindle render` (and `rindle deploy`) merge it onto the
# `rindle.ncl` library embedded in the `rindle` binary, so there is nothing to import or install.
# The `dev` profile renders `.rindle/rindled.json` — the same daemon config we hand-wrote in
# `daemon.json` (minus the optional `nWorkers`, which sizes from host vCPU) — plus a `rindle.json`
# discovery manifest naming the app.
#
# Local dev still runs off `daemon.json` (see package.json `daemon`/`dev`): bare `rindle up`
# auto-detects it and keeps the legacy single-daemon path. This file is what the CLOUD tooling reads:
#   rindle deploy                 # ensure/re-attach the managed app on Rindle Cloud (headwaters)
#   rindle migrate apply --remote # push migrations/ to that app's daemon through the control plane
#
# The `app` name below becomes the cloud `displayName` and groups every component under one app in
# `rindle ps`. `dev` maps to the cloud `single` profile — one standalone daemon, which is what our
# deployed app (app_a218b5eae4fd49bc → rindle-a218b5eae4fd49bc.fly.dev) is.
{
  profile = "dev",
  app = "strut",
  daemonHttpPort = 7600,
  daemonWsPort = 7601,
}
