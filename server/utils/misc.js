var ip_last_hit = new Map();
function rateLimitReq(ctx, req, limit, suffix) {
    limit = limit !== undefined ? limit : 1;
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now()

    if (suffix !== undefined) ip += suffix;
    // purge hits older than seconds_max
    ip_last_hit.forEach((v, k) => {
        const seconds = (now - v) / 1000;
        if (seconds > limit) {
            ip_last_hit.delete(ip)
        }
    })

    let result = false;
    // if ip is still in the map, abort
    if (ip_last_hit.has(ip)) {
        // console.log(`api rate limited for ${ip}: ${req}`);
        // throw new Error(`Rate limit reached: one call per ${minutes_max} minutes allowed.`);
        console.error(`Rate limit reached: one call per ${limit} second allowed.`);
        ctx.status = 429;
        ctx.body = 'Too Many Requests';
        result = true;
    }

    // record api hit
    ip_last_hit.set(ip, now);
    return result;
}

function checkCSRF(ctx, csrf) {
    try { ctx.assertCSRF(csrf); } catch (e) {
        ctx.status = 403;
        ctx.body = 'invalid csrf token';
        console.log('-- invalid csrf token -->', ctx.request.method, ctx.request.url, ctx.session.uid);
        return false;
    }
    return true;
}

module.exports = {
    rateLimitReq,
    checkCSRF
};
