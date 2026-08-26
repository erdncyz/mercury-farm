import assert from 'node:assert/strict'
import test from 'node:test'
import {ScrcpyVideoStreamParser} from '../lib/units/device/resources/scrcpy.js'

function makeHeader() {
    const header = Buffer.alloc(69)
    header[0] = 0
    header.write('Pixel 8', 1)
    header.writeUInt16BE(1080, 65)
    header.writeUInt16BE(2400, 67)
    return header
}

function makePacket(data, {pts = 123456, config = false, keyframe = false} = {}) {
    let ptsAndFlags = BigInt(pts)
    if (config) ptsAndFlags |= 1n << 63n
    if (keyframe) ptsAndFlags |= 1n << 62n
    const meta = Buffer.alloc(12)
    meta.writeBigUInt64BE(ptsAndFlags, 0)
    meta.writeUInt32BE(data.length, 8)
    return Buffer.concat([meta, data])
}

test('parses fragmented scrcpy header and H.264 frame metadata', () => {
    const parser = new ScrcpyVideoStreamParser()
    const info = []
    const packets = []
    parser.on('info', value => info.push(value))
    parser.on('packet', value => packets.push(value))

    const config = Buffer.from([0, 0, 0, 1, 0x67, 0x42, 0xe0, 0x1f])
    const keyframe = Buffer.from([0, 0, 0, 1, 0x65, 1, 2, 3, 4])
    const stream = Buffer.concat([
        makeHeader(),
        makePacket(config, {config: true, pts: 0}),
        makePacket(keyframe, {keyframe: true, pts: 987654})
    ])

    for (let offset = 0; offset < stream.length; offset += 7) {
        parser.push(stream.subarray(offset, offset + 7))
    }

    assert.deepEqual(info, [{name: 'Pixel 8', width: 1080, height: 2400}])
    assert.equal(packets.length, 2)
    assert.equal(packets[0].config, true)
    assert.deepEqual(packets[0].data, config)
    assert.equal(packets[1].keyframe, true)
    assert.equal(packets[1].pts, 987654)
    assert.deepEqual(packets[1].data, keyframe)
})

test('rejects impossible video packet sizes without buffering unbounded data', () => {
    const parser = new ScrcpyVideoStreamParser()
    const errors = []
    parser.on('error', error => errors.push(error))

    const invalidMeta = Buffer.alloc(12)
    invalidMeta.writeUInt32BE(17 * 1024 * 1024, 8)
    parser.push(Buffer.concat([makeHeader(), invalidMeta]))

    assert.equal(errors.length, 1)
    assert.match(errors[0].message, /Invalid scrcpy video packet size/)
    assert.equal(parser.buffer.length, 0)
})
