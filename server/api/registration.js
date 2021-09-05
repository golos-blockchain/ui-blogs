import koa_router from 'koa-router';
import koa_body from 'koa-body';
import config from 'config';
import Tarantool from 'db/tarantool';
import { checkCSRF, getRemoteIp, rateLimitReq } from 'server/utils/misc';
import { hash } from 'golos-lib-js/lib/auth/ecc';
import { api } from 'golos-lib-js';
import secureRandom from 'secure-random';
import gmailSend from 'gmail-send'
import passport from 'koa-passport';
const VKontakteStrategy = require('passport-vk').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const MailruStrategy = require('passport-mail').Strategy;
const YandexStrategy = require('passport-yandex').Strategy;

function digits(text) {
    const digitArray = text.match(/\d+/g);
    return digitArray ? digitArray.join('') : '';
}

/**
 * return status types:
 * session - new user without identity in DB
 * waiting - user verification email in progress
 * done - user verification email is successfuly done
 * already_used -
 * attempts_10 - Confirmation was attempted a moment ago. You can try again only in 10 seconds
 * attempts_300 - Confirmation was attempted a moment ago. You can try again only in 5 minutes
 * @param {*} app
 */
export default function useRegistrationApi(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    const router = koa_router({ prefix: '/api/v1' });
    app.use(router.routes());
    const koaBody = koa_body();

    const strategies = {
        vk: VKontakteStrategy, facebook: FacebookStrategy,
        mailru: MailruStrategy, yandex: YandexStrategy
    };
    for (const [grantId, grant] of Object.entries(config.grant)) {
        const strategy = strategies[grantId];
        if (!strategy) continue;
        try {
            passport.use(new strategy(
                {
                    clientID: grant.key,
                    clientSecret: grant.secret,
                    callbackURL: `${config.REST_API}/api/v1/auth/${grantId}/callback`,
                    passReqToCallback: true
                },
                async (req, accessToken, refreshToken, params, profile, done) => {
                    console.log(req)
                    req.session.soc_id = profile.id;
                    req.session.soc_id_type = grantId + '_id';

                    const idHash = hash.sha256(req.session.soc_id.toString(), 'hex');

                    console.log('-- social select user');

                    let user = await Tarantool.instance('tarantool').select('users', 'by_verify_uid',
                        1, 0, 'eq', ['social-' + grantId, idHash, req.session.uid]);

                    if (!user[0]) {
                        console.log('-- social insert user');
                        user = await Tarantool.instance('tarantool').insert('users',
                            [null, req.session.uid, 'social-' + grantId, idHash, true, '1234', getRemoteIp(req), false]);
                    }

                    req.session.user = user[0][0];

                    done(null, {profile});
                }
            ));
        } catch (ex) {
            console.error(`ERROR: Wrong config.grant.${grantId} settings. Fix them or just disable registration with ${grantId}. Error is following:`)
            throw ex;
        }
    }

    router.post('/verify_code', koaBody, function*() {
        if (rateLimitReq(this, this.req, 10)) return;

        if (!this.request.body) {
            this.status = 400;
            this.body = 'Bad Request';
            return;
        }

        const body = this.request.body;
        let params = {};

        let error = false

        if (typeof body === 'string') {
            try {
                params = JSON.parse(body);
            } catch (e) {}
        } else {
            params = body;
        }

        if (!checkCSRF(this, params.csrf)) return;

        const { confirmation_code, email } = params;

        console.log(
            '-- /api/v1/verify_code -->',
            email,
            confirmation_code
        );

        const emailHash = hash.sha256(email, 'hex');

        const user = yield Tarantool.instance('tarantool').select('users', 'by_verify_uid',
            1, 0, 'eq', ['email', emailHash, this.session.uid, false]);

        if (!user[0]) {
            this.status = 401;
            this.body = 'No confirmation for this e-mail';
            return;
        }

        if (user[0][5] != confirmation_code) {
            this.status = 401;
            this.body = 'Wrong confirmation code';
            return;
        }

        yield Tarantool.instance('tarantool').update('users', 'primary', [user[0][0]], [['=', 4, true]])

        this.session.user = user[0][0];

        this.body =
            'GOLOS.id \nСпасибо за подтверждение вашей почты';
    });

    router.post('/send_code', koaBody, function*() {
        if (rateLimitReq(this, this.req)) return;

        if (!config.gmail_send.user || !config.gmail_send.pass) {
          this.status = 401;
          this.body = 'Mail service disabled';
          return;
        }

        const body = this.request.body;
        let params = {};

        if (typeof body === 'string') {
            try {
                params = JSON.parse(body);
            } catch (e) {}
        } else {
            params = body;
        }

        if (!checkCSRF(this, params.csrf)) return;

        const { email } = params;

        //const retry = params.retry ? params.retry : null;

        if (!email || !/^[a-z0-9](\.?[a-z0-9]){5,}@g(oogle)?mail\.com$/.test(email)) {
            this.body = JSON.stringify({ status: 'provide_email' });
            return;
        }

        const emailHash = hash.sha256(email, 'hex');

        console.log('/send_code existing_email');

        const existing_email = yield Tarantool.instance('tarantool').select('users', 'by_verify_registered',
            1, 0, 'eq', ['email', emailHash, true]);
        if (existing_email[0]) {
            console.log('-- /send_code existing_email error -->',
                this.session.user, this.session.uid,
                emailHash, existing_email[0][0]
            );
            this.body = JSON.stringify({ status: 'already_used' });
            return;
        }

        let confirmation_code = parseInt(
            secureRandom.randomBuffer(8).toString('hex'),
            16
        ).toString(10).substring(0, 4); // 4 digit code

        console.log('-- /send_code select user');

        let user = yield Tarantool.instance('tarantool').select('users', 'by_verify_uid',
            1, 0, 'le', ['email', emailHash, this.session.uid, true]);

        // TODO возможно сделать срок активности для кодов
        //const seconds_ago = (Date.now() - mid.updated_at) / 1000.0;
        //const timeAgo = process.env.NODE_ENV === 'production' ? 300 : 10;

        //if (retry) {
        //    confirmation_code = mid.confirmation_code;
        //} else {
        //    if (seconds_ago < timeAgo) {
        //        this.body = JSON.stringify({ status: 'attempts_300' });
        //        return;
        //    }
        //    yield mid.update({ confirmation_code, email: emailHash });
        //}

        if (user[0] && user[0][2] === 'email' && user[0][3] === emailHash && user[0][1] === this.session.uid) {
            if (user[0][4]) {
                this.body = JSON.stringify({
                    status: 'done',
                });
                this.session.user = user[0][0];
                return;
            }
        } else {
            user[0] = null;
        }

        // Send mail
        const send = gmailSend({
            user: config.gmail_send.user,
            pass: config.gmail_send.pass,
            from: 'registrator@golos.id',
            to: email,
            subject: 'Golos verification code',
        });

        try {
            yield send({
                html: `Registration code: <h4>${confirmation_code}</h4>`,
            });
        } catch (e) {
            console.log(e);

            this.body = JSON.stringify({
                status: 'error',
                error: 'Send code error ' + e,
            });

            return;
        }

        const ip = getRemoteIp(this.request.req);

        if (!user[0]) {
            console.log('-- /send_code insert user');
            user = yield Tarantool.instance('tarantool').insert('users',
                [null, this.session.uid, 'email', emailHash, false,
                confirmation_code, ip, false]);
        } else {
            console.log('-- /send_code update user');
            user = yield Tarantool.instance('tarantool').update('users',
                'primary', [user[0][0]],
                [['=', 5, confirmation_code], ['=', 6, ip]])
        }

        this.body = JSON.stringify({
            status: 'waiting',
        });
    });

    router.post('/use_invite', koaBody, function*() {
        if (rateLimitReq(this, this.req)) return;

        const body = this.request.body;
        let params = {};
        let error = false

        if (typeof body === 'string') {
            try {
                params = JSON.parse(body);
            } catch (e) {}
        } else {
            params = body;
        }

        if (!checkCSRF(this, params.csrf)) return;

        const { invite_key } = params

        //const retry = params.retry ? params.retry : null;

        if (!invite_key) {
            this.body = JSON.stringify({ status: 'provide_email' });
            return;
        }

        let invite = null;
        try {
            invite = yield api.getInviteAsync(invite_key);
        } catch (err) {
            if (err.message.includes('Invalid value')) {
                this.body = JSON.stringify({ status: 'no_invite' });
            } else {
                this.body = JSON.stringify({ status: 'blockchain_not_available' });
            }
            return;
        }
        if (!invite) {
            this.body = JSON.stringify({ status: 'no_invite' });
            return;
        }

        console.log('-- /use_invite select user');

        const inviteHash = hash.sha256(invite_key, 'hex');

        let user = yield Tarantool.instance('tarantool').select('users', 'by_verify_uid',
            1, 0, 'eq', ['invite_code', inviteHash, this.session.uid]);

        if (!user[0]) {
            console.log('-- /use_invite insert user');
            user = yield Tarantool.instance('tarantool').insert('users',
                [null, this.session.uid, 'invite_code', inviteHash, true, '1234', getRemoteIp(this.request.req), false]);
        }

        this.session.user = user[0][0];

        this.body = JSON.stringify({
            status: 'done',
        });
    });

    router.get('/auth/vk', passport.authenticate('vkontakte'));
    router.get('/auth/vk/callback', passport.authenticate('vkontakte', {
        successRedirect: '/api/v1/auth/success',
        failureRedirect: '/api/v1/auth/failure'
    }));

    router.get('/auth/facebook', passport.authenticate('facebook'));
    router.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/api/v1/auth/success',
        failureRedirect: '/api/v1/auth/failure'
    }));

    router.get('/auth/mailru', passport.authenticate('mailru'));
    router.get('/auth/mailru/callback', passport.authenticate('mailru', {
        successRedirect: '/api/v1/auth/success',
        failureRedirect: '/api/v1/auth/failure'
    }));

    router.get('/auth/yandex', passport.authenticate('yandex'));
    router.get('/auth/yandex/callback', passport.authenticate('yandex', {
        successRedirect: '/api/v1/auth/success',
        failureRedirect: '/api/v1/auth/failure'
    }));

    router.get('/auth/failure', function*() {
        this.status = 200;
        this.statusText = 'OK';
        this.body = {
            status: 'cannot_authorize',
            statusText: 'Cannot register - cannot authorize with social network.'
        };
    });

    router.get('/auth/success', function*() {
        this.status = 200;
        this.statusText = 'OK';
        this.body = '<script>window.close();</script>';
    });
}
