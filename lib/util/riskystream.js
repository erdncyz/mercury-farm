import EventEmitter from 'events';
class RiskyStream extends EventEmitter {
    stream;
    expectingEnd = false;
    ended = false;
    endListener;
    constructor(stream) {
        super();
        this.endListener = () => {
            this.ended = true;
            this.stream.removeListener('end', this.endListener);
            if (!this.expectingEnd) {
                this.emit('unexpectedEnd');
            }
            this.emit('end');
        };
        this.stream = stream.on('end', this.endListener);
    }
    end() {
        this.expectEnd();
        return this.stream.end();
    }
    expectEnd() {
        this.expectingEnd = true;
        return this;
    }
    async waitForEnd() {
        const stream = this.stream;
        this.expectEnd();
        return new Promise((resolve) => {
            if (stream.ended) {
                return resolve(true);
            }
            const endListener = () => {
                stream.removeListener('end', endListener);
                resolve(true);
            };
            stream.on('end', endListener);
            // Make sure we actually have a chance to get the 'end' event.
            stream.resume();
        });
    }
}
export default RiskyStream;
