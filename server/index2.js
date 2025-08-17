
import Koa from 'koa';
import Router from 'koa-router'
import { renderToString } from 'react-dom/server';
import React from 'react'
import './sasstest.scss'
import './csstest.css'
import TestCom from 'server/TestCom'

const app = new Koa();

const router = new Router()
app.use(router.routes());

global.$STM_Config = { x: 111 };

router.get('/', (ctx) => {
    ctx.status = 200
    ctx.statusText = 'OK'
    console.log('1:', global.$STM_Config);
    ctx.body = renderToString(<TestCom />)
    const process = require('node:process');
    //process.exit(9)
})

export default function startServer(parameters) {
    console.log('parameters is', parameters)
    console.log('chunks are', parameters.chunks())
    const port = 8080
    console.log('Server started', port);
    app.listen(port);
}
