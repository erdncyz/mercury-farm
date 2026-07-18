// builds

import {deleteBuild} from '../../controllers/builds.js'

export function del(req, res) {
    return deleteBuild(req, res)
}
