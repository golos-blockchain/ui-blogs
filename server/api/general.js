import koa_router from 'koa-router';
import koa_body from 'koa-body';
import config from 'config';
import recordWebEvent from 'server/record_web_event';
import {rateLimitReq, checkCSRF} from 'server/utils/misc';
import coBody from 'co-body';
import {PublicKey, Signature, hash} from 'golos-lib-js/lib/auth/ecc';
import {api, broadcast} from 'golos-lib-js';
import { getDynamicGlobalProperties } from 'app/utils/APIWrapper'
import useGetAddressHandler from 'server/api/uia_address'

export default function useGeneralApi(app) {
    const router = koa_router({prefix: '/api/v1'});
    app.use(router.routes());
    const koaBody = koa_body();

    router.get('/healthcheck', function *() {
        this.status = 200;
        this.statusText = 'OK';
        this.body = {status: 200, statusText: 'OK'};
    })

    router.get('/gls-supply', function * () {
        const data = yield api.getDynamicGlobalPropertiesAsync();

        this.status = 200;
        this.statusText = 'OK';
        this.body = data.current_supply.split(' ')[0];
    })

    router.get('/gbg-supply', function * () {
        const data = yield api.getDynamicGlobalPropertiesAsync();

        this.status = 200;
        this.statusText = 'OK';
        this.body = data.current_sbd_supply.split(' ')[0];
    })

    router.post('/login_account', koaBody, function *() {
        const params = this.request.body;
        const {csrf, account} = typeof(params) === 'string' ? JSON.parse(params) : params;
        if (!checkCSRF(this, csrf)) return;
        console.log('-- /login_account -->', this.session.uid, account);
        try {
            this.session.a = account;

            let body = { status: 'ok' }
            this.body = JSON.stringify(body);
        } catch (error) {
            console.error('Error in /login_account api call', this.session.uid, error.message);
            this.body = JSON.stringify({error: error.message});
            this.status = 500;
        }
        recordWebEvent(this, 'api/login_account', account);
    });

    router.post('/logout_account', koaBody, function *() {
        // if (rateLimitReq(this, this.req)) return; - logout maybe immediately followed with login_attempt event
        const params = this.request.body;
        const {csrf} = typeof(params) === 'string' ? JSON.parse(params) : params;
        if (!checkCSRF(this, csrf)) return;
        console.log('-- /logout_account -->', this.session.uid);
        try {
            this.session.a = this.session.user = this.session.uid = null;
            this.body = JSON.stringify({status: 'ok'});
        } catch (error) {
            console.error('Error in /logout_account api call', this.session.uid, error);
            this.body = JSON.stringify({error: error.message});
            this.status = 500;
        }
    });

    router.post('/record_event', koaBody, function *() {
        if (rateLimitReq(this, this.req)) return;
        try {
            const params = this.request.body;
            const {csrf, type, value} = typeof(params) === 'string' ? JSON.parse(params) : params;
            if (!checkCSRF(this, csrf)) return;
            console.log('-- /record_event -->', this.session.uid, type, value);
            const str_value = typeof value === 'string' ? value : JSON.stringify(value);
            recordWebEvent(this, type, str_value);
            this.body = JSON.stringify({status: 'ok'});
        } catch (error) {
            console.error('Error in /record_event api call', error.message);
            this.body = JSON.stringify({error: error.message});
            this.status = 500;
        }
    });

    router.post('/csp_violation', function *() {
        if (rateLimitReq(this, this.req)) return;
        const params = yield coBody.json(this);
        console.log('-- /csp_violation -->', this.req.headers['user-agent'], params);
        this.body = '';
    });

    router.post('/page_view', koaBody, function *() {
        this.body = JSON.stringify({views: 1});
    });

    useGetAddressHandler(router)
}
