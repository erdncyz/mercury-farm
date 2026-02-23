import EventEmitter from 'events';
class FailCounter extends EventEmitter {
    threshold;
    time;
    values = [];
    constructor(threshold, time) {
        super();
        this.threshold = threshold;
        this.time = time;
    }
    inc() {
        const now = Date.now();
        while (this.values.length) {
            if (now - this.values[0] >= this.time) {
                this.values.shift();
            }
            else {
                break;
            }
        }
        this.values.push(now);
        if (this.values.length > this.threshold) {
            this.emit('exceedLimit', this.threshold, this.time);
        }
    }
}
export default FailCounter;
