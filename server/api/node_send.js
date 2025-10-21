import Router from 'koa-router'
import koa_body from 'koa-body';
import golos from 'golos-lib-js'
import JsonRPC from 'simple-jsonrpc-js'

// WARNING: If changing some route path here, don't forget to fix the logger

function useNodeSendApi(app) {
    const koaBody = koa_body();

    const router = new Router({ prefix: '/api/v1/node_send' })
    app.use(router.routes())

    const INVALID_REQUEST = -32600

    // router.options('/', koaBody, (ctx) => {
    //     ctx.set('Access-Control-Allow-Origin', '*')
    //     ctx.set('Access-Control-Allow-Headers', 'Content-Type')

    //     ctx.body = ''
    // })

    router.post('/', koaBody, async (ctx) => {
        ctx.set('Content-Type', 'application/json')
        // ctx.set('Access-Control-Allow-Origin', '*')
        // ctx.set('Access-Control-Allow-Headers', 'Content-Type')

        let jrpc = new JsonRPC()

        jrpc.on('call', 'pass', async (params) =>{
            if (params.length < 2 || params.length > 3) {
                throw jrpc.customException(INVALID_REQUEST, 'A member "params" should be ["api", "method", "args"]')
            }

            const [ api, method, args ] = params
            if (!Array.isArray(args)) {
                throw jrpc.customException(INVALID_REQUEST, 'A member "args" should be array')
            }

            let result
            try {
                result = await golos.api.sendAsync(
                    api,
                    {
                        method,
                        params: args,
                    })
            } catch (error) {
                if (error.payload) {
                    const { code, message, data } = error.payload.error
                    throw jrpc.customException(code, message, data)
                } else { // http
                    const { code, message, data } = error
                    throw jrpc.customException(code, message, data)
                }
            }

            return result
        })

        jrpc.toStream = (message) => {
            ctx.body = message
        }

        let str = ctx.request.body
        if (typeof(str) !== 'string') {
            str = JSON.stringify(str)
        }

        try {
            await jrpc.messageHandler(str)
        } catch (err) {}
    })
}

module.exports = useNodeSendApi
