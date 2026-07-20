const baseUrl = process.env.RINDLE_URL ?? 'http://127.0.0.1:7650'
const versionUrl = new URL('/version', baseUrl)
const deadline = Date.now() + 60_000

console.log(`[dev] waiting for Rindle at ${baseUrl}`)

while (Date.now() < deadline) {
  try {
    const response = await fetch(versionUrl, {
      signal: AbortSignal.timeout(1_000),
    })
    if (response.ok) {
      console.log('[dev] Rindle is ready; starting Vite')
      process.exit(0)
    }
  } catch {
    // The edge or its follower is still starting.
  }

  await new Promise((resolve) => setTimeout(resolve, 100))
}

console.error(`[dev] Rindle did not become ready at ${versionUrl} within 60s`)
process.exit(1)
