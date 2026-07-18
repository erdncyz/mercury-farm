// builds

import {getBuilds, deleteBuilds} from '../controllers/builds.js'

export function get(req, res) {
    return getBuilds(req, res)
}

export function del(req, res) {
    return deleteBuilds(req, res)
}
