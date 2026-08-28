import assert from 'node:assert/strict'
import test from 'node:test'

import {retryOnTransactionTimeout} from '../lib/units/reaper/index.js'

test('retries initial device loading after transaction timeouts', async() => {
    let attempts = 0
    let retries = 0

    const result = await retryOnTransactionTimeout(async() => {
        attempts += 1
        if (attempts < 3) {
            throw new Error('Timeout when running transaction')
        }
        return ['connected-device']
    }, () => {
        retries += 1
    }, 0)

    assert.deepEqual(result, ['connected-device'])
    assert.equal(attempts, 3)
    assert.equal(retries, 2)
})

test('does not retry non-timeout failures', async() => {
    let retries = 0

    await assert.rejects(
        retryOnTransactionTimeout(
            async() => {
                throw new Error('database unavailable')
            },
            () => {
                retries += 1
            },
            0
        ),
        /database unavailable/
    )

    assert.equal(retries, 0)
})
