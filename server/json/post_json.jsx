import Router from 'koa-router'
import React from 'react';
import {routeRegex} from "app/ResolveRoute";
import {api} from 'golos-lib-js';

const DEFAULT_VOTE_LIMIT = 10000

export default function usePostJson(app) {
    const router = new Router()
    app.use(router.routes());

    router.get(routeRegex.PostJson, async (ctx) => {
        // validate and build post details in JSON
        const author = ctx.url.match(/(\@[\w\d\.-]+)/)[0].replace('@', '');
        const permalink = ctx.url.match(/(\@[\w\d\.-]+)\/?([\w\d-]+)/)[2];
        let status = "";
        let post = await api.getContentAsync(author, permalink, DEFAULT_VOTE_LIMIT);

        if (post.author) {
            status = "200";
            // try parse for post metadata
            try {
                post.json_metadata = JSON.parse(post.json_metadata);
            } catch(e) {
                post.json_metadata = "";
            }
        } else {
            post = "No post found";
            status = "404";
        }
        // return response and status code
        ctx.body = {post, status};
    });
}
