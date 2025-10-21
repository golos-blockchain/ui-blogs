import Router from 'koa-router'
import koa_body from 'koa-body';
import config from 'config';
import fs from 'fs'
import recordWebEvent from 'server/record_web_event';
import { rateLimitReq } from 'server/utils/misc'
import coBody from 'co-body';
import {PublicKey, Signature, hash} from 'golos-lib-js/lib/auth/ecc';
import {api, broadcast} from 'golos-lib-js';
import { getDynamicGlobalProperties } from 'app/utils/APIWrapper'

export default function useGeneralApi(app) {
    const router = new Router({ prefix: '/api/v1' })
    app.use(router.routes());
    const koaBody = koa_body();

    router.get('/testit', (ctx) => {
        ctx.status = 200
        ctx.statusText = 'OK'
        ctx.set('Content-Type', 'application/javascript')
        ctx.body = fs.readFileSync('./server/api/test.js')
    })

    router.get('/healthcheck', (ctx) => {
        ctx.status = 200
        ctx.statusText = 'OK'
        ctx.body = {status: 200, statusText: 'OK'}
    })

    router.get('/gls-supply', async (ctx) => {
        const data = await api.getDynamicGlobalPropertiesAsync()

        ctx.status = 200
        ctx.statusText = 'OK'
        ctx.body = data.current_supply.split(' ')[0]
    })

    router.get('/gbg-supply', async (ctx) => {
        const data = await api.getDynamicGlobalPropertiesAsync()

        ctx.status = 200
        ctx.statusText = 'OK'
        ctx.body = data.current_sbd_supply.split(' ')[0]
    })

    router.post('/login_account', koaBody, (ctx) => {
        const params = ctx.request.body
        const {csrf, account} = typeof(params) === 'string' ? JSON.parse(params) : params;
        if (!ctx.checkCSRF(csrf)) return;
        console.log('-- /login_account -->', ctx.session.uid, account)
        try {
            ctx.session.a = account;

            let body = { status: 'ok' }
            ctx.body = JSON.stringify(body);
        } catch (error) {
            console.error('Error in /login_account api call', ctx.session.uid, error.message);
            ctx.body = JSON.stringify({error: error.message});
            ctx.status = 500;
        }
        recordWebEvent(ctx, 'api/login_account', account);
    })

    router.post('/logout_account', koaBody, ctx => {
        // if (rateLimitReq(ctx, ctx.req)) return; - logout maybe immediately followed with login_attempt event
        const params = ctx.request.body;
        const {csrf} = typeof(params) === 'string' ? JSON.parse(params) : params;
        if (!ctx.checkCSRF(csrf)) return;
        console.log('-- /logout_account -->', ctx.session.uid);
        try {
            ctx.session.a = ctx.session.user = ctx.session.uid = null;
            ctx.body = JSON.stringify({status: 'ok'});
        } catch (error) {
            console.error('Error in /logout_account api call', ctx.session.uid, error);
            ctx.body = JSON.stringify({error: error.message});
            ctx.status = 500;
        }
    })

    router.post('/record_event', koaBody, ctx => {
        if (rateLimitReq(ctx, ctx.req)) return;
        try {
            const params = ctx.request.body;
            const {csrf, type, value} = typeof(params) === 'string' ? JSON.parse(params) : params;
            if (!ctx.checkCSRF(csrf)) return;
            const str_value = typeof value === 'string' ? value : JSON.stringify(value);
            recordWebEvent(ctx, type, str_value);
            ctx.body = JSON.stringify({status: 'ok'});
        } catch (error) {
            console.error('Error in /record_event api call', error.message);
            ctx.body = JSON.stringify({error: error.message});
            ctx.status = 500;
        }
    })

    router.post('/csp_violation', async (ctx) => {
        if (rateLimitReq(ctx, ctx.req)) return;
        const params = await coBody.json(ctx);
        console.log('-- /csp_violation -->', ctx.req.headers['user-agent'], params);
        ctx.body = '';
    })

    router.post('/page_view', koaBody, ctx => {
        ctx.body = JSON.stringify({views: 1});
    })
}
