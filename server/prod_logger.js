var bytes = require('bytes');

module.exports = prod_logger;

function prod_logger() {
    return async function logger(ctx, next) {
        // request
        var start = new Date;
        var asset = ctx.originalUrl.indexOf('/assets/') === 0
            || ctx.originalUrl.indexOf('/images/') === 0
            || ctx.originalUrl.indexOf('/favicon.ico') === 0;
        if (!asset) {
            var uid = ctx.session.uid ? ctx.session.uid + ' ' : '' 
            console.log(`[reqid ${ctx.request.header['x-request-id']}] ${uid}${ctx.method} ${ctx.originalUrl}`);
        }
        try {
            await next()
        } catch (err) {
            log(ctx, start, null, err, false);
            throw err;
        }
        var length = ctx.response.length;
        log(ctx, start, length, null, asset);
    }
}

function log(ctx, start, len, err, asset) {
    var status = err
        ? (err.status || 500)
        : (ctx.status || 404);

    var length;
    if (~[204, 205, 304].indexOf(status)) {
        length = '';
    } else if (null == len) {
        length = '-';
    } else {
        length = bytes(len);
    }

    var upstream = err ? 'xxx ' : '';

    if (!asset || err || ctx.status > 400) {
        console.log(`${upstream}[reqid ${ctx.request.header['x-request-id']}] ${(ctx.session.uid || '')} ${ctx.method} ${ctx.originalUrl} ${status} ${time(start)} ${length}`);
    }
}

function time(start) {
    var delta = new Date - start;
    // delta = delta < 10000
    //     ? delta + 'ms'
    //     : Math.round(delta / 1000) + 's';
    return delta + 'ms';
}
