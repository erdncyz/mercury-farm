import EventEmitter from 'events';
class TTLItem {
    value;
    time;
    prev;
    next;
    constructor(value, time, prev, next) {
        this.value = value;
        this.time = time;
        this.prev = prev;
        this.next = next;
    }
}
class TTLSet extends EventEmitter {
    ttl;
    head = null;
    tail = null;
    mapping = {};
    timer = null;
    static SILENT = 1;
    constructor(ttl = 30_000) {
        super();
        this.ttl = ttl;
    }
    bump(value, time, flags) {
        const item = this.remove(this.mapping[value]) ||
            this.create(value, this.tail, flags);
        item.time = time || Date.now();
        this.tail = item;
        if (item.prev) {
            item.prev.next = item;
        }
        else {
            this.head = item;
        }
        this.scheduleCheck();
    }
    drop(value, flags) {
        this._drop(this.mapping[value], flags);
    }
    stop() {
        clearTimeout(this.timer);
    }
    scheduleCheck() {
        clearTimeout(this.timer);
        if (this.head) {
            const delay = Math.max(0, this.ttl - (Date.now() - this.head.time));
            this.timer = setTimeout(this.check.bind(this), delay);
        }
    }
    check() {
        const now = Date.now();
        let item;
        while ((item = this.head)) {
            if (now - item.time > this.ttl) {
                this._drop(item, 0);
            }
            else {
                break;
            }
        }
        this.scheduleCheck();
    }
    create(value, prev, flags) {
        const item = new TTLItem(value, 0, prev, null);
        this.mapping[value] = item;
        if ((flags & TTLSet.SILENT) !== TTLSet.SILENT) {
            this.emit('insert', value);
        }
        return item;
    }
    _drop(item, flags) {
        if (item) {
            this.remove(item);
            delete this.mapping[item.value];
            if ((flags & TTLSet.SILENT) !== TTLSet.SILENT) {
                this.emit('drop', item.value);
            }
        }
    }
    remove(item) {
        if (!item) {
            return null;
        }
        if (item.prev) {
            item.prev.next = item.next;
        }
        if (item.next) {
            item.next.prev = item.prev;
        }
        if (item === this.head) {
            this.head = item.next;
        }
        if (item === this.tail) {
            this.tail = item.prev;
        }
        item.next = item.prev = null;
        return item;
    }
}
export default TTLSet;
