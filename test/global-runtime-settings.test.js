import assert from 'node:assert/strict'
import test from 'node:test'
import DbClient from '../lib/db/index.js'
import * as apiutil from '../lib/util/apiutil.js'
import {loadGlobalRuntimeSettings, resetUserSettings} from '../lib/db/models/user/model.js'

const RUNTIME_SETTINGS = {
    androidRuntimeSettings: {profile: 'balanced', screenFrameRate: 25, screenJpegQuality: 15},
    iosRuntimeSettings: {profile: 'quality', screenCaptureMode: 'auto'}
}

function useFakeUsers(users) {
    const updates = []
    DbClient.connection = {
        collection: () => ({
            findOne: async({email}) => users[email] || null,
            updateOne: async(filter, update) => {
                updates.push({filter, update})
                return {modifiedCount: 1}
            }
        })
    }
    return updates
}

test('loads the admin-chosen runtime settings shared by every user', async() => {
    useFakeUsers({
        [apiutil.MERCURY_ADMIN_EMAIL]: {
            settings: {...RUNTIME_SETTINGS, alertMessage: {data: 'hi'}, dateFormat: 'x'}
        }
    })

    assert.deepEqual(await loadGlobalRuntimeSettings(), RUNTIME_SETTINGS)
})

test('returns no runtime settings until an admin picks them', async() => {
    useFakeUsers({})

    assert.deepEqual(await loadGlobalRuntimeSettings(), {})
})

test('resetting a regular user clears only their own settings', async() => {
    const updates = useFakeUsers({[apiutil.MERCURY_ADMIN_EMAIL]: {settings: RUNTIME_SETTINGS}})

    await resetUserSettings('user@example.com')

    assert.deepEqual(updates, [{filter: {email: 'user@example.com'}, update: {$set: {settings: {}}}}])
})

test('resetting the admin user keeps the shared runtime settings', async() => {
    const updates = useFakeUsers({
        [apiutil.MERCURY_ADMIN_EMAIL]: {settings: {...RUNTIME_SETTINGS, dateFormat: 'x'}}
    })

    await resetUserSettings(apiutil.MERCURY_ADMIN_EMAIL)

    assert.deepEqual(updates[0].update, {$set: {settings: RUNTIME_SETTINGS}})
})
