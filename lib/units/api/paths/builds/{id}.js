// builds

import {getBuild, deleteBuild} from '../../controllers/builds.js'

export function get(req, res) {
    return getBuild(req, res)
}

export function del(req, res) {
    return deleteBuild(req, res)
}
