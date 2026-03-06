// import * as jwtutil from '../../util/jwtutil.js'
// import * as urlutil from '../../util/urlutil.js'
// import dbapi from '../../db/api.js'
import {accessTokenAuth} from './helpers/securityHandlers.js'

const publicApiDocPaths = new Set([
    '/scheme',
    '/swagger.json',
    '/api/v1/scheme',
    '/api/v1/swagger.json'
])

function isPublicApiDocPath(req) {
    return publicApiDocPaths.has(req.path) || req.path.startsWith('/api/v1/docs')
}

export function auth(options) {
    return function(req, res, next) {
        if (isPublicApiDocPath(req)) {
            next()
            return
        }

        if (req.headers.authorization) { // needed for /app/api/v1/ requests
            req.options = {
                secret: options.secret
            }
            accessTokenAuth(req)
                .then(() => {
                    next()
                })
                .catch((err) => {
                    res.status(err.status)
                    res.json({message: err.message})
                })
        }
        else {
            res.redirect('/')
        }
    }
}
