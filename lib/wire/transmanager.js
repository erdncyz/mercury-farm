import { v4 as uuidv4 } from 'uuid';
import apiutil from '../util/apiutil.js';
import { TransactionDoneMessage } from './wire.js';
import { WireRouter } from './router.js';
import * as Sentry from '@sentry/node';
import wireutil from './util.js';
const sentryTransactionSpan = (channel, message, timeout, cb) => Sentry.startSpan({
    op: 'wireTransaction',
    name: message.$code,
    attributes: {
        message,
        channel,
        timeout
    },
    forceTransaction: true,
}, cb);
const sentryCaptureTimeout = (channel, message, timeout) => {
    Sentry.addBreadcrumb({
        data: { channel, message, timeout },
        message: 'Transaction context',
        level: 'warning',
        type: 'default'
    });
    Sentry.captureMessage('Timeout when running transaction');
};
export const runTransaction = (channel, messageType, message, { sub, push, channelRouter, timeout = apiutil.GRPC_WAIT_TIMEOUT }) => sentryTransactionSpan(channel, message, timeout, () => {
    const responseChannel = 'txn_' + uuidv4();
    sub.subscribe(responseChannel);
    return new Promise((resolve, reject) => {
        const messageListener = new WireRouter()
            .on(TransactionDoneMessage, (channel, message) => {
            clearTimeout(trTimeout);
            sub.unsubscribe(responseChannel);
            channelRouter.removeListener(responseChannel, messageListener);
            if (message.success) {
                resolve(message);
            }
            else {
                reject(message);
            }
        })
            .handler();
        const trTimeout = setTimeout(function () {
            channelRouter.removeListener(responseChannel, messageListener);
            sub.unsubscribe(responseChannel);
            sentryCaptureTimeout(channel, message, timeout);
            reject(new Error('Timeout when running transaction'));
        }, timeout);
        channelRouter.on(responseChannel, messageListener);
        push.send([
            channel,
            wireutil.tr(responseChannel, messageType, message)
        ]);
    });
});
export const runTransactionDev = (channel, messageType, message, { sub, push, router, timeout = apiutil.GRPC_WAIT_TIMEOUT }) => sentryTransactionSpan(channel, message, timeout, () => {
    const responseChannel = 'txn_' + uuidv4();
    sub.subscribe(responseChannel);
    return new Promise((resolve, reject) => {
        const messageListener = (channel, message) => {
            clearTimeout(trTimeout);
            sub.unsubscribe(responseChannel);
            router.removeListener(TransactionDoneMessage, messageListener);
            const body = message.body ? JSON.parse(message.body) : {};
            if (message.success) {
                resolve(body);
            }
            else {
                reject(body);
            }
        };
        router.on(TransactionDoneMessage, messageListener);
        const trTimeout = setTimeout(() => {
            router.removeListener(TransactionDoneMessage, messageListener);
            sub.unsubscribe(responseChannel);
            sentryCaptureTimeout(channel, message, timeout);
            reject(new Error('Timeout when running transaction'));
        }, timeout);
        push.send([
            channel,
            wireutil.tr(responseChannel, messageType, message)
        ]);
    });
});
