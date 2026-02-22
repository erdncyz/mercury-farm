import EventEmitter from 'events'

class FailCounter extends EventEmitter {
    private threshold: number
    private time: number
    private values: number[] = []

    constructor(threshold: number, time: number) {
        super()
        this.threshold = threshold
        this.time = time
    }

    inc(): void {
        const now = Date.now()
        while (this.values.length) {
            if (now - this.values[0] >= this.time) {
                this.values.shift()
            } else {
                break
            }
        }
        this.values.push(now)
        if (this.values.length > this.threshold) {
            this.emit('exceedLimit', this.threshold, this.time)
        }
    }
}

export default FailCounter

