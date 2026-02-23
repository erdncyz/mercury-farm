import logger from "./logger.js";
const log = logger.createLogger("util:lifecycle");
export default new (class Lifecycle {
    cleanups = [];
    ending = false;
    constructor() {
        process.on("SIGINT", this.graceful.bind(this));
        process.on("SIGTERM", this.graceful.bind(this));
    }
    share(name, emitter) {
        emitter.on("end", () => {
            if (!this.ending) {
                log.fatal(`${name} ended; we shall share its fate`);
                this.fatal();
            }
        });
        emitter.on("error", (err) => {
            if (!this.ending) {
                log.fatal(`${name} had an error ${err.stack}`);
                this.fatal();
            }
        });
        if ('end' in emitter) {
            this.observe(() => {
                if (typeof emitter.end === 'function') {
                    emitter.end();
                }
            });
        }
        return emitter;
    }
    graceful(err) {
        log.info(`Winding down for graceful exit ${err || ''}`);
        if (this.ending) {
            log.error("Repeated gracefull shutdown request. Exiting immediately.");
            process.exit(1);
        }
        this.ending = true;
        return Promise.all(this.cleanups.map((fn) => fn())).then(() => process.exit(0));
    }
    fatal(err) {
        log.fatal(`Shutting down due to fatal error ${err || ''}`);
        this.ending = true;
        process.exit(1);
    }
    observe(cleanupFn) {
        this.cleanups.push(cleanupFn);
    }
})();
