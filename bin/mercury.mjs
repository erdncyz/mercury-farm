#!/usr/bin/env -S ./node_modules/.bin/tsx --import ./lib/util/instrument.mjs
import packageData from '../package.json' with { type: 'json' }
console.log(`Starting Mercury ${packageData.version}`)
import '../lib/cli/index.js'
