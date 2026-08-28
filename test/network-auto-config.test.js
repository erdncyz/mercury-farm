import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import test from 'node:test'

const projectRoot = path.resolve(import.meta.dirname, '..')

function makeExecutable(file, body) {
  writeFileSync(file, `#!/bin/bash\n${body}\n`)
  chmodSync(file, 0o755)
}

function runAutoConfig({routeInterface, interfaceIps, ifconfigOutput = ''}) {
  const root = mkdtempSync(path.join(tmpdir(), 'mercury-network-test-'))
  const scripts = path.join(root, 'scripts')
  const bin = path.join(root, 'bin')
  mkdirSync(scripts)
  mkdirSync(bin)

  cpSync(path.join(projectRoot, 'scripts', 'auto-configure-network.sh'), path.join(scripts, 'auto-configure-network.sh'))
  writeFileSync(path.join(scripts, 'variables.env'), 'MERCURY_DOMAIN=192.0.2.10\n')

  makeExecutable(path.join(bin, 'route'), `printf '   interface: %s\\n' '${routeInterface}'`)
  makeExecutable(path.join(bin, 'ipconfig'), [
    'if [[ "$1" != "getifaddr" ]]; then exit 1; fi',
    ...Object.entries(interfaceIps).map(([iface, ip]) => `[[ "$2" == "${iface}" ]] && { printf '%s\\n' '${ip}'; exit 0; }`),
    'exit 1',
  ].join('\n'))
  makeExecutable(path.join(bin, 'ifconfig'), `printf '%s\\n' '${ifconfigOutput}'`)

  execFileSync('/bin/bash', [path.join(scripts, 'auto-configure-network.sh')], {
    env: {...process.env, PATH: `${bin}:${process.env.PATH}`},
  })

  return readFileSync(path.join(scripts, 'variables.env'), 'utf8')
}

test('prefers the default-route address over a link-local en0 address', () => {
  const variables = runAutoConfig({
    routeInterface: 'en1',
    interfaceIps: {en0: '169.254.114.51', en1: '172.28.34.27'},
  })

  assert.match(variables, /^MERCURY_DOMAIN=172\.28\.34\.27$/m)
})

test('never publishes a link-local address when no routable address exists', () => {
  const variables = runAutoConfig({
    routeInterface: 'en0',
    interfaceIps: {en0: '169.254.114.51'},
    ifconfigOutput: 'inet 169.254.114.51 netmask 0xffff0000',
  })

  assert.match(variables, /^MERCURY_DOMAIN=192\.0\.2\.10$/m)
})
