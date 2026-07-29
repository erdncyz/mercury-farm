// builds

import {setBuildScenarios} from '../../../controllers/builds.js'

export function put(req, res) {
    return setBuildScenarios(req, res)
}
