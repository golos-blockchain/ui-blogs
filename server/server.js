import path from 'path';
import fs from 'fs';
import Koa from 'koa';
import compress from 'koa-compress'
import mount from 'koa-mount';
import helmet from 'koa-helmet';
import koa_logger from 'koa-logger';
import prod_logger from './prod_logger';
import favicon from 'koa-favicon';
import staticCache from 'koa-static-cache';
import useRedirects from './redirects';
import useGeneralApi from './api/general';
import useNodeSend from './api/node_send'
import useUserJson from './json/user_json';
import usePostJson from './json/post_json';
import isBot from './utils/isBot'
import session from './utils/cryptoSession';
import CSRF from './utils/csrf'
import config from 'config';
import { routeRegex } from 'app/ResolveRoute';
import secureRandom from 'secure-random';
import { APP_NAME_UP } from 'app/client_config';
import { isBlocked } from 'app/utils/blacklist'

console.log('application server starting, please wait.');

const app = new Koa();
app.name = APP_NAME_UP + ' app';
const env = process.env.NODE_ENV || 'development';
// cache of a thousand days
const cacheOpts = { maxAge: 86400000, gzip: true };

app.keys = [config.get('session_key')];

const crypto_key = config.get('server_session_secret');

session(app, {
    maxAge: 1000 * 3600 * 24 * 60,
    crypto_key,
    key: config.get('session_cookie_key')
});
app.use(new CSRF())

function convertEntriesToArrays(obj) {
    return Object.keys(obj).reduce((result, key) => {
        result[key] = obj[key].split(/\s+/);
        return result;
    }, {});
}

// for redirects
let messengerHost
try {
    messengerHost = config.get('messenger_service.host')
} catch (err) {
    console.warn('messenger_service.host is not set')
}

// some redirects
app.use(async (ctx, next) => {
    if (messengerHost && (ctx.url === '/msgs' || ctx.url.startsWith('/msgs/'))) {
        ctx.url = ctx.url.replace('/msgs', '') // only 1st occurence
        ctx.url = new URL(ctx.url, messengerHost).toString()
        ctx.redirect(ctx.url)
        return
    }
    // normalize url for %40 opportunity for @ in posts
    if (ctx.url.indexOf('%40') !== -1) {
      const transfer = ctx.url.split("?")[0].split(`/`).includes(`transfers`);
      if (!transfer) {
        //  fixme potential 500
        ctx.redirect(decodeURIComponent(ctx.url));
        return;
      }
    }
    // redirect to home page/feed if known account
    if (ctx.method === 'GET' && ctx.url === '/' && ctx.session.a) {
        ctx.status = 302;
        ctx.redirect(`/@${ctx.session.a}/feed`);
        return;
    }
    // normalize user name url from cased params
    if (
        ctx.method === 'GET' &&
            (routeRegex.UserProfile1.test(ctx.url) ||
                routeRegex.PostNoCategory.test(ctx.url))
    ) {
        const p = ctx.originalUrl.toLowerCase();
		let userCheck = "";
		if (routeRegex.Post.test(ctx.url)) {
			userCheck = p.split("/")[2].slice(1);
		} else {
			userCheck = p.split("/")[1].slice(1);
		}
		if (isBlocked(userCheck, $STM_Config.blocked_users)) {
			console.log('Illegal content user found blocked', `@${userCheck}`);
			ctx.status = 451;
			return;
		}
        if (p !== ctx.originalUrl) {
            ctx.status = 301;
            ctx.redirect(p);
            return;
        }
    }
    // normalize top category filtering from cased params
    if (ctx.method === 'GET' && routeRegex.CategoryFilters.test(ctx.url)) {
        const p = ctx.originalUrl.toLowerCase();
        if (p !== ctx.originalUrl) {
            ctx.status = 301;
            ctx.redirect(p);
            return;
        }
    }
    // remember ch, cn, r url params in the session and remove them from url
    if (ctx.method === 'GET' && /\?[^\w]*(ch=|cn=|r=)/.test(ctx.url)) {
        let redir = ctx.url.replace(/((ch|cn|r)=[^&]+)/gi, r => {
            const p = r.split('=');
            if (p.length === 2) ctx.session[p[0]] = p[1];
            return '';
        });
        redir = redir.replace(/&&&?/, '');
        redir = redir.replace(/\?&?$/, '');
        console.log(`server redirect ${ctx.url} -> ${redir}`);
        ctx.status = 302;
        ctx.redirect(redir);
    } else {
        await next()
    }
});

// load production middleware
if (env === 'production') {
    app.use(require('koa-conditional-get')());
    app.use(require('koa-etag')());
    app.use(compress({
        filter: (content_type) => {
            return /text/i.test(content_type)
        },
        threshold: 2048,
        gzip: {
            flush: require('zlib').constants.Z_SYNC_FLUSH,
        },
        deflate: {
            flush: require('zlib').constants.Z_SYNC_FLUSH,
        },
        br: false,
    }))
}

// Logging
if (env === 'production') {
    app.use(prod_logger());
} else {
    app.use(koa_logger());
}
app.use(mount('/static', staticCache(path.join(__dirname, '../app/assets/static'), cacheOpts)));

app.use(
    mount('/robots.txt', (ctx) => {
        ctx.set('Cache-Control', 'public, max-age=86400000')
        ctx.type = 'text/plain'
        ctx.body = 'User-agent: *\nHost: https://golos.id\nSitemap: https://golos.id/sitemap.xml'
    })
);

// set user's uid - used to identify users in logs and some other places
// FIXME SECURITY PRIVACY cycle this uid after a period of time
app.use(async (ctx, next) => {
    if (! /(\.js(on)?|\.css|\.map|\.ico|\.png|\.jpe?g)$/.test(ctx.url)) {
        const last_visit = ctx.session.last_visit;
        ctx.session.last_visit = new Date().getTime() / 1000 | 0;
        if (!ctx.session.uid) {
            ctx.session.uid = secureRandom.randomBuffer(13).toString('hex');
            ctx.session.new_visit = true;
        } else {
            ctx.session.new_visit = ctx.session.last_visit - last_visit > 1800;
        }
    }
    await next()
})

useRedirects(app);
useUserJson(app);
usePostJson(app);
useGeneralApi(app);
useNodeSend(app)
// helmet wants some things as bools and some as lists, makes config difficult.
// our config uses strings, this splits them to lists on whitespace.

if (env === 'production') {
    const helmetConfig = {
        directives: convertEntriesToArrays(config.get('helmet.directives')),
        reportOnly: false,
    };
    helmetConfig.directives.reportUri = '/api/v1/csp_violation';
    //helmetConfig.directives.upgradeInsecureRequests = null;
    //app.use(helmet.contentSecurityPolicy(helmetConfig));
} else {
    app.use(helmet({
        contentSecurityPolicy: false
    }))
}

app.use(favicon(path.join(__dirname, '../app/assets/images/favicons/favicon.ico')));
app.use(mount('/favicons', staticCache(path.join(__dirname, '../app/assets/images/favicons'), cacheOpts)));
app.use(mount('/images', staticCache(path.join(__dirname, '../app/assets/images'), cacheOpts)));
app.use(mount('/sitemap.xml', staticCache(path.join(__dirname, '../app/assets/sitemap.xml'), cacheOpts)));
app.use(isBot());

// Proxy asset folder to webpack development server in development mode
if (env === 'development') {
    const webpack_dev_port = process.env.PORT
        ? parseInt(process.env.PORT) + 1
        : 8081;
    const proxyhost = `http://127.0.0.1:${webpack_dev_port}`;
    console.log('proxying to webpack dev server at ' + proxyhost);
    const proxy = require('koa-proxy')({
        host: proxyhost,
        map: filePath => 'assets/' + filePath
    });
    app.use(mount('/assets', proxy));
} else {
    app.use(mount('/assets', staticCache(path.join(__dirname, '../build-client'), cacheOpts)));
}

if (env !== 'test') {
    const appRender = require('./app_render');
    app.use(async (ctx) => {
        // clear require() cache if in development mode
        // (makes asset hot reloading work)
        if (process.env.NODE_ENV !== 'production') {
            //webpackIsomorphicTools.refresh()
        }

        await appRender(ctx);
        // if (app_router.dbStatus.ok) recordWebEvent(this, 'page_load');
        const bot = ctx.isBot;
        if (bot) {
            console.log(`[reqid ${ctx.request.header['x-request-id']}] ${ctx.method} ${ctx.originalUrl} ${ctx.status} (BOT '${bot}')`)
        }
    })

    const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

    app.listen(port);

    // Tell parent process koa-server is started
    if (process.send) process.send('online');
    console.log(`Application started on port ${port}`);
}

module.exports = app;
