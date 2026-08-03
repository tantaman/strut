# Strut's Rindle topology — the colocated pair: one `rindle-replicator` write-master + one `rindled`
# follower, fronted by a `rindle-dev-edge` ingress.
#
# A topology is a plain record of inputs; `rindle render` (and `rindle deploy`) merge it onto the
# `rindle.ncl` library embedded in the `rindle` binary, so there is nothing to import or install.
# `rindle up`/`dev` render `.rindle/{replicator,follower-0,dev-edge}.json` plus a `rindle.json`
# discovery manifest naming the app, then supervise all three.
#
# Local dev runs off THIS file — see package.json `daemon`/`dev`. Rindle 0.9 dropped the legacy
# single-daemon path (the hand-written `daemon.json`, ports 7600/7601) along with the `dev` profile
# and its `daemonHttpPort`/`daemonWsPort` inputs; the whole fleet is now reached through the dev-edge
# ingress on ONE port, 127.0.0.1:22050 (http + ws). `rindle dev` injects it into the app command as
# RINDLE_URL (`rindle exec` adds RINDLE_DAEMON_URL / RINDLE_FLEET_WS); server/rindleEnv.ts takes any
# of them.
#
# It is also what the CLOUD tooling reads:
#   rindle deploy                # ensure/re-attach the managed app on Rindle Cloud (headwaters)
#   rindle migrate apply --cloud # push migrations/ to that app's daemon through the control plane
#
# The `app` name below becomes the cloud `displayName` and groups every component under one app in
# `rindle ps`. `followers = 1` is the Cloud Sync plan — our deployed app is
# app_a218b5eae4fd49bc → rindle-a218b5eae4fd49bc.fly.dev.
{
  profile = "replicated",
  app = "strut",
  followers = 1,
}
