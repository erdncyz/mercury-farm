export default function noStore(_req, res, next) {
    res.setHeader('Cache-Control', 'no-store')
    next()
}
