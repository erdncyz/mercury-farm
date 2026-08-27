import assert from 'node:assert/strict'
import test from 'node:test'
import {getDirectionalSwipe, isPointerAction} from '../lib/units/ios-device/plugins/wda/client.js'

test('uses directional swipes for large axis-aligned scroll gestures', () => {
    assert.equal(getDirectionalSwipe({fromX: 200, fromY: 700, toX: 205, toY: 250}), 'up')
    assert.equal(getDirectionalSwipe({fromX: 350, fromY: 400, toX: 100, toY: 390}), 'left')
})

test('keeps precise actions for short or diagonal drags', () => {
    assert.equal(getDirectionalSwipe({fromX: 200, fromY: 300, toX: 210, toY: 350}), null)
    assert.equal(getDirectionalSwipe({fromX: 100, fromY: 100, toX: 300, toY: 300}), null)
})

test('recognizes an iOS pointer tap', () => {
    assert.equal(isPointerAction({
        actions: [{
            type: 'pointer',
            actions: [
                {type: 'pointerMove', duration: 0, x: 100, y: 200},
                {type: 'pointerDown', button: 0},
                {type: 'pointerMove', duration: 0, x: 100, y: 200},
                {type: 'pointerUp'}
            ]
        }]
    }), true)
})

test('recognizes an iOS pointer swipe', () => {
    assert.equal(isPointerAction({
        actions: [{
            type: 'pointer',
            actions: [
                {type: 'pointerDown', button: 0},
                {type: 'pause', duration: 40},
                {type: 'pointerMove', duration: 300, x: 100, y: 200},
                {type: 'pointerUp'}
            ]
        }]
    }), true)
})

test('does not classify keyboard actions as pointer gestures', () => {
    assert.equal(isPointerAction({
        actions: [{type: 'key', actions: [{type: 'keyDown', value: 'a'}]}]
    }), false)
})