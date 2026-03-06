import { delay, http, HttpResponse } from 'msw'

import { mercuryApiClient } from '@/api/mercury-api/mercury-api-client'

import { MERCURY_API_ROUTES } from '@/api/mercury-api/routes'

import { USER_RESPONSE } from './responses/user-response'
import { DEVICES_WITH_VARIOUS_DATA } from './responses/device-list-response'

export const handlers = [
  http.get(mercuryApiClient.defaults.baseURL + MERCURY_API_ROUTES.devices, async () => {
    await delay()

    return HttpResponse.json(DEVICES_WITH_VARIOUS_DATA)
  }),
  http.get(mercuryApiClient.defaults.baseURL + MERCURY_API_ROUTES.user, async () => {
    await delay()

    return HttpResponse.json(USER_RESPONSE)
  }),
]
