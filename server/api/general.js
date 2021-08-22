import koa_router from 'koa-router';
import koa_body from 'koa-body';
import Tarantool from 'db/tarantool';
import config from 'config';
import recordWebEvent from 'server/record_web_event';
import {emailRegex, getRemoteIp, rateLimitReq, checkCSRF} from 'server/utils/misc';
import coBody from 'co-body';
import {PublicKey, Signature, hash} from 'golos-classic-js/lib/auth/ecc';
import {api, broadcast} from 'golos-classic-js';
import { getDynamicGlobalProperties } from 'app/utils/APIWrapper'

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

    router.post('/accounts', koaBody, function *() {
        if (rateLimitReq(this, this.req)) return;
        const params = this.request.body;
        const account = typeof(params) === 'string' ? JSON.parse(params) : params;
        if (!checkCSRF(this, account.csrf)) return;
        console.log('-- /accounts -->', this.session.uid, this.session.user, account);

        const user_id = parseInt(this.session.user);
        if (isNaN(user_id)) { // require user to sign in with identity provider
            this.body = JSON.stringify({error: 'Unauthorized'});
            this.status = 401;
            if (this.session.user) {
                console.log('-- /accounts - user_id is NaN:', user_id, account)
            }
            return;
        }

        console.log('-- /accounts lock_entity');

        const lock_entity_res = yield Tarantool.instance('tarantool').call('lock_entity', user_id.toString());
        if (!lock_entity_res[0][0]) {
            console.log('-- /accounts lock_entity -->', user_id, lock_entity_res[0][0]);
            this.body = JSON.stringify({error: 'Conflict'});
            this.status = 409;
            return;
        }

        try {
            console.log('-- /accounts check user id');

            const user = yield Tarantool.instance('tarantool').select('users', 'primary',
                1, 0, 'eq', [user_id]);
            if (!user[0]) {
                this.body = JSON.stringify({error: 'Unauthorized'});
                this.status = 401;
                console.log('-- /accounts - user_id is wrong:', user_id, account)
                return;
            }

            if (user[0][7]) {
                throw new Error('Only one Golos account per user is allowed in order to prevent abuse');
            }

            console.log('-- /accounts check same_email_account');

            if (user[0][2] === 'email') {
                const emailHash = user[0][3];
                const existing_email = yield Tarantool.instance('tarantool').select('users', 'by_verify_registered',
                    1, 0, 'eq', ['email', emailHash, true]);
                if (existing_email[0]) {
                    console.log('-- /accounts existing_email error -->',
                        this.session.user, this.session.uid,
                        emailHash, existing_email[0][0]
                    );
                    console.log(`api /accounts: existing_same-email account ${this.session.uid} #${user_id}, IP ${remote_ip}`);
                    throw new Error('Account with such email already registered');
                }
            }

            console.log('-- /accounts check same_ip_account');

            const remote_ip = getRemoteIp(this.req);
            const same_ip_account = yield Tarantool.instance('tarantool').select('accounts', 'by_remote_ip',
                1, 0, 'eq', [remote_ip]);
            if (same_ip_account[0]) {
                const seconds = (Date.now() - parseInt(same_ip_account[0][9])) / 1000;
                const minSeconds = process.env.REGISTER_INTERVAL_SEC || 10*60;
                if (seconds < minSeconds) {
                    const minMinutes = Math.ceil(minSeconds / 60);
                    console.log(`api /accounts: IP rate limit for user ${this.session.uid} #${user_id}, IP ${remote_ip}`);
                    throw new Error('Only one Golos account allowed per IP address every ' + minMinutes + ' minutes');
                }
            }

            let json_metadata = '';

            let mid;
            if (account.invite_code && !this.session.soc_id) {
                if (!user[0][4]) {
                    console.log(`api /accounts: try to skip use_invite step by user ${this.session.uid} #${user_id}`);
                    throw new Error('Not passed entering use_invite step');
                }
                else {
                  console.log(`api /accounts: found use_invite step for user ${this.session.uid} #${user_id}`)
                }
            } else if (this.session.soc_id && this.session.soc_id_type) {
                if (!user[0][4]) {
                    console.log(`api /accounts: not authorized with social site for user ${this.session.uid} #${user_id}`);
                    throw new Error('Not authorized with social site');
                }
                else {
                  console.log(`api /accounts: is authorized with social site for user ${this.session.uid} #${user_id}`)
                }
                json_metadata = {[this.session.soc_id_type]: this.session.soc_id};
                json_metadata = JSON.stringify(json_metadata);
            } else {
                if (!user[0][4]) {
                    console.log(`api /accounts: not confirmed e-mail for user ${this.session.uid} #${user_id}`);
                    throw new Error('E-mail is not confirmed');
                }
                else {
                  console.log(`api /accounts: is confirmed e-mail for user ${this.session.uid} #${user_id}`)
                }
            }

            console.log('-- /accounts creating account');

            const [fee_value, fee_currency] = config.get('registrar.fee').split(' ');
            const delegation = config.get('registrar.delegation')

            let fee = parseFloat(fee_value);
            let max_referral_interest_rate;
            let max_referral_term_sec;
            let max_referral_break_fee;
            try {
                const chain_properties = yield api.getChainPropertiesAsync();
                const chain_fee = parseFloat(chain_properties.account_creation_fee);
                if (chain_fee && chain_fee > fee) {
                    if (fee / chain_fee > 0.5) { // just a sanity check - chain fee shouldn't be a way larger
                        console.log('-- /accounts warning: chain_fee is larger than config fee -->', this.session.uid, fee, chain_fee);
                        fee = chain_fee;
                    }
                }
                max_referral_interest_rate = chain_properties.max_referral_interest_rate;
                max_referral_term_sec = chain_properties.max_referral_term_sec;
                max_referral_break_fee = chain_properties.max_referral_break_fee;
            } catch (error) {
                console.error('Error in /accounts get_chain_properties', error);
            }

            const dgp = yield api.getDynamicGlobalPropertiesAsync();

            let extensions = [];
            if (!account.invite_code && account.referrer)
            {
                extensions = 
                [[
                    0, {
                        referrer: account.referrer,
                        interest_rate: max_referral_interest_rate,
                        end_date: new Date(Date.parse(dgp.time) + max_referral_term_sec*1000).toISOString().split(".")[0],
                        break_fee: max_referral_break_fee
                    }
                ]];
            }

            yield createAccount({
                signingKey: config.get('registrar.signing_key'),
                fee: `${fee.toFixed(3)} ${fee_currency}`,
                creator: config.registrar.account,
                new_account_name: account.name,
                owner: account.owner_key,
                active: account.active_key,
                posting: account.posting_key,
                memo: account.memo_key,
                delegation,
                json_metadata,
                extensions,
                invite_secret: account.invite_code ? account.invite_code : ''
            });

            console.log('-- create_account_with_keys created -->', this.session.uid, account.name, user_id, account.owner_key);

            // store email
            let email = account.email || '';

            try {
                yield Tarantool.instance('tarantool').insert('accounts',
                    [null, user_id, account.name,
                    account.owner_key, account.active_key, account.posting_key, account.memo_key,
                    this.session.r || '', '', Date.now().toString(), email, remote_ip]);
            } catch (error) {
                console.error('!!! Can\'t create account model in /accounts api', this.session.uid, error);
            }

            yield Tarantool.instance('tarantool').update('users', 'primary', [user_id], [['=', 7, true]])

            this.body = JSON.stringify({status: 'ok'});
        } catch (error) {
            console.error('Error in /accounts api call', this.session.uid, error.toString());
            this.body = JSON.stringify({error: error.message});
            this.status = 500;
        } finally {
            // console.log('-- /accounts unlock_entity -->', user_id);
            yield Tarantool.instance('tarantool').call('unlock_entity', user_id.toString());
        }
        recordWebEvent(this, 'api/accounts', account ? account.name : 'n/a');
    });

    router.post('/login_account', koaBody, function *() {
        const params = this.request.body;
        const {csrf, account} = typeof(params) === 'string' ? JSON.parse(params) : params;
        if (!checkCSRF(this, csrf)) return;
        console.log('-- /login_account -->', this.session.uid, account);
        try {
            this.session.a = account;

            const dbAccount = yield Tarantool.instance('tarantool').select('accounts', 'by_name',
                1, 0, 'eq', [account]);
            if (dbAccount[0]) {
                this.session.user = dbAccount[0][1];
            }

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
}

/**
 @arg signingKey {string|PrivateKey} - WIF or PrivateKey object
 */
export function* createAccount({
    signingKey, fee, creator, new_account_name, json_metadata = '',
    owner, active, posting, memo, delegation, extensions, invite_secret = ''
}) {
    let operations = [[(invite_secret == '' ? 'account_create_with_delegation' : 'account_create_with_invite'), {
        fee, creator, new_account_name, json_metadata,
        owner: {weight_threshold: 1, account_auths: [], key_auths: [[owner, 1]]},
        active: {weight_threshold: 1, account_auths: [], key_auths: [[active, 1]]},
        posting: {weight_threshold: 1, account_auths: [], key_auths: [[posting, 1]]},
        memo_key: memo, extensions: extensions
    }]]
    if (invite_secret != '') {
        operations[0][1].invite_secret = invite_secret;
    } else {
        operations[0][1].delegation = delegation;
    }
    yield broadcast.sendAsync({
        extensions: [],
        operations
    }, [signingKey])
}
const parseSig = hexSig => {try {return Signature.fromHex(hexSig)} catch(e) {return null}}
