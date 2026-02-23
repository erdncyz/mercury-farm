import url from 'url';
import util from 'util';
import dns from 'dns/promises';
import _ from 'lodash';
function groupByPriority(records) {
    return records
        .sort((a, b) => a.priority - b.priority)
        .reduce(function (acc, record) {
        if (acc.length) {
            const last = acc[acc.length - 1];
            if (last[0].priority !== record.priority) {
                acc.push([record]);
            }
            else {
                last.push(record);
            }
        }
        else {
            acc.push([record]);
        }
        return acc;
    }, []);
}
function shuffleWeighted(records) {
    function pick(records, sum) {
        const rand = Math.random() * sum;
        let counter = 0;
        for (let i = 0, l = records.length; i < l; ++i) {
            counter += records[i].weight;
            if (rand < counter) {
                const picked = records.splice(i, 1);
                return picked.concat(pick(records, sum - picked[0].weight));
            }
        }
        return [];
    }
    const sorted = records.sort((a, b) => b.weight - a.weight);
    const sum = _.sumBy(records, 'weight');
    return pick(sorted, sum);
}
export const sort = function (records) {
    return groupByPriority(records).flatMap(shuffleWeighted);
};
export const resolve = async function (domain) {
    const parsedUrl = URL.parse(domain);
    if (!parsedUrl || !parsedUrl.protocol) {
        return Promise.reject(new Error(util.format('Must include protocol in "%s"', domain)));
    }
    if (/^srv\+/.test(parsedUrl.protocol)) {
        parsedUrl.protocol = parsedUrl.protocol.slice(4);
        const resolved = await dns.resolveSrv(parsedUrl.hostname);
        const records = sort(resolved);
        return records.map(function (record) {
            parsedUrl.host = util.format('%s:%d', record.name, record.port);
            parsedUrl.hostname = record.name;
            parsedUrl.port = record.port.toString();
            return { ...record, url: url.format(parsedUrl) };
        });
    }
    else {
        return Promise.resolve([
            {
                url: domain,
                name: parsedUrl.hostname,
                port: parsedUrl.port,
            },
        ]);
    }
};
export const attempt = (records, fn) => {
    async function next(i) {
        if (i >= records.length) {
            throw new Error('No more records left to try');
        }
        try {
            await fn(records[i]);
        }
        catch (err) {
            next(i + 1);
        }
    }
    return next(0);
};
export default {
    sort,
    resolve,
    attempt,
};
