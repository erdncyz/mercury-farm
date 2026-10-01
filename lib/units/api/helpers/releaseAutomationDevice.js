import dbapi from '../../../db/api.js'
import wireutil from '../../../wire/util.js'
import {runTransaction} from '../../../wire/transmanager.js'
import {ConnectStopMessage, UngroupMessage} from '../../../wire/wire.js'

export default async function releaseAutomationDevice(serial, groupId, transport) {
    const device = await dbapi.loadDeviceBySerial(serial)
    if (!device) {
        throw new Error(`Cannot release automation device "${serial}": device not found`)
    }

    // A reservation may outlive its device's ownership. Never stop a newer run.
    if (device.owner ? device.owner.group !== groupId :
        device.automationAlive?.group !== groupId &&
        !(device.usage === 'automation' && device.group?.id === groupId)) {
        return
    }
    if (device.present === false || !device.channel) {
        throw new Error(`Cannot release automation device "${serial}": device is unavailable`)
    }

    try {
        await runTransaction(device.channel, ConnectStopMessage, {}, transport)
        await runTransaction(device.channel, UngroupMessage, {
            requirements: wireutil.toDeviceRequirements({
                serial: {value: serial, match: 'exact'}
            })
        }, transport)
    }
    catch (err) {
        let detail = String(err)
        if (err instanceof Error) {
            detail = err.message
        }
        else if (err && typeof err === 'object' && 'data' in err) {
            detail = String(err.data)
        }
        throw new Error(`Failed to release automation device "${serial}": ${detail}`, {cause: err})
    }
}
