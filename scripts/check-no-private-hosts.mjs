#!/usr/bin/env node
/**
 * Fail the build if a PRIVATE_HOSTS entry appears anywhere in the published output.
 *
 * schema.ts has always refused to let a private host into a record's `url`. What nothing
 * checked was whether the blocklist ITSELF got published — and it did: TelemetryMap.tsx was a
 * client component importing '@/content', which dragged schema.ts (zod + the hostnames) into
 * a public JS chunk. The guard protected the data and shipped the secret.
 *
 * This closes that class of bug rather than the one instance. It greps the real artifact, so
 * it catches any future route back into the bundle — a new client component importing
 * content, a value import replacing the `import type` in TelemetryMap, a host name written
 * into a comment that survives minification.
 *
 * Runs as `postbuild`, so `npm run build` covers it and deploy-shyamsinh.sh inherits it for
 * free. The hosts are read out of schema.ts rather than restated here; a second copy of a
 * list of secrets is its own leak.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCHEMA = join(ROOT, 'src/content/schema.ts')
const OUT = join(ROOT, 'out')

/** Pull the string literals out of `export const PRIVATE_HOSTS ... = [ ... ]`. */
function privateHosts() {
  const src = readFileSync(SCHEMA, 'utf8')
  const decl = src.match(/PRIVATE_HOSTS[^=]*=\s*\[([^\]]*)\]/s)
  if (!decl) {
    throw new Error(
      `Could not find the PRIVATE_HOSTS array in ${relative(ROOT, SCHEMA)}. ` +
        `If it was renamed or reshaped, update this script — do not delete it.`
    )
  }
  const hosts = [...decl[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1])
  if (hosts.length === 0) {
    // An empty blocklist is legitimate (nothing to hide) but must be deliberate, so say so
    // rather than exiting silently green and looking like a passing check.
    console.log('check-no-private-hosts: PRIVATE_HOSTS is empty — nothing to check.')
    process.exit(0)
  }
  return hosts
}

function* files(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* files(path)
    else yield path
  }
}

const hosts = privateHosts()
const hits = []

for (const path of files(OUT)) {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    continue // binary (fonts, PNGs) — readFileSync utf8 won't throw, but be safe
  }
  for (const host of hosts) {
    if (text.includes(host)) hits.push({ path: relative(ROOT, path), host })
  }
}

if (hits.length > 0) {
  console.error(
    `\ncheck-no-private-hosts: FAILED — a private host is in the published output.\n`
  )
  for (const { path, host } of hits) console.error(`  ${host}  in  ${path}`)
  console.error(
    `\nThese hostnames identify a client's internal environment and must never be served.\n` +
      `The usual cause is a 'use client' component importing '@/content', which pulls\n` +
      `src/content/schema.ts (and zod) into a browser chunk. Pass the data down from a\n` +
      `server component instead, and keep any type import as \`import type\`.\n`
  )
  process.exit(1)
}

console.log(`check-no-private-hosts: OK — ${hosts.length} host(s) absent from out/.`)
