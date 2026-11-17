import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import test from 'node:test'
import {ProcessManager} from '../lib/util/ProcessManager.js'

class FakeChild extends EventEmitter {
    exitCode = null
    signalCode = null
    killed = false

    kill(signal) {
        this.killed = true
        this.signalCode = signal
        setImmediate(() => this.emit('exit', null, signal))
        return true
    }
}

test('kills a child whose process was removed while spawn() was pending', async() => {
    const child = new FakeChild()
    let finishSpawn
    const manager = new ProcessManager({
        spawn: () => new Promise(resolve => {
            finishSpawn = () => resolve(child)
        })
    }, {killTimeout: 100})

    await manager.create('dev', {})
    const started = manager.start('dev')
    await new Promise(r => setImmediate(r))

    await manager.remove('dev')
    finishSpawn()

    assert.equal(await started, false)
    assert.equal(child.killed, true)
})

test('kills the previous live child before spawning a replacement', async() => {
    const children = []
    const manager = new ProcessManager({
        spawn: () => {
            const child = new FakeChild()
            children.push(child)
            setImmediate(() => child.emit('message', 'ready'))
            return child
        }
    }, {killTimeout: 100})

    await manager.create('dev', {})
    assert.equal(await manager.start('dev'), true)
    assert.equal(await manager.start('dev', true), true)

    assert.equal(children.length, 2)
    assert.equal(children[0].killed, true)
    assert.equal(children[1].killed, false)
})
