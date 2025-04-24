import Router from 'koa-router'

const redirects = [
    // example: [/\/about(\d+)-(.+)/, '/about?$0:$1', 302],
    [/^\/recent\/?$/, '/created']
];

export default function useRedirects(app) {
    const router = new Router()

    app.use(router.routes());

    redirects.forEach(r => {
        router.get(r[0], (ctx) => {
            const dest = Object.keys(ctx.params).reduce((value, key) => value.replace('$' + key, ctx.params[key]), r[1]);
            console.log(`server redirect: [${r[0]}] ${ctx.request.url} -> ${dest}`);
            ctx.status = r[2] || 301;
            ctx.redirect(dest);
        });
    });
}
