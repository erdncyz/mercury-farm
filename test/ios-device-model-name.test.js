import assert from 'node:assert/strict'
import test from 'node:test'

import {getModelName} from '../lib/units/ios-device/plugins/util/iosutil.js'

test('maps current iPhone product identifiers to marketing names', () => {
    assert.equal(getModelName('iPhone18,1'), 'iPhone 17 Pro')
    assert.equal(getModelName('iPhone18,2'), 'iPhone 17 Pro Max')
    assert.equal(getModelName('iPhone18,3'), 'iPhone 17')
    assert.equal(getModelName('iPhone18,4'), 'iPhone Air')
    assert.equal(getModelName('iPhone18,5'), 'iPhone 17e')
})

test('keeps existing device database mappings', () => {
    assert.equal(getModelName('iPhone17,5'), 'iPhone 16e')
})

test('returns null for an unknown product identifier so callers can use the device name', () => {
    assert.equal(getModelName('iPhone99,9'), null)
})
