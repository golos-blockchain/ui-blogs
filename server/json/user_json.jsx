import Router from 'koa-router'
import React from 'react';
import {routeRegex} from "app/ResolveRoute";
import {api} from 'golos-lib-js';

export default function useUserJson(app) {
    const router = new Router()
    app.use(router.routes());

    router.get(routeRegex.UserJson, async (ctx) => {
        // validate and build user details in JSON
        const segments = ctx.url.split('/');
        const user_name = segments[1].match(routeRegex.UserNameJson)[0].replace('@', '');
        let user = "";
        let status = "";

        const [chainAccount] = await api.getAccountsAsync([user_name]);

        if (chainAccount) {
            user = chainAccount;
            try {
                user.json_metadata = JSON.parse(user.json_metadata);
            } catch (e) {
                user.json_metadata = "";
            }
            status = "200";
        } else {
            user = "No account found";
            status = "404";
        }
        // return response and status code
        ctx.body = {user, status};
    });
}
