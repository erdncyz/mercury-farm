import {bookDevice, releaseBooking} from '../../../controllers/devices.js'

export function post(req, res) {
    return bookDevice(req, res)
}

export function del(req, res) {
    return releaseBooking(req, res)
}
