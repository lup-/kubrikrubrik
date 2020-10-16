'use strict';

const Koa = require('koa');
const Router = require('@koa/router');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = new Koa();
const router = new Router();

router.get('/api/users/:id', ctx => {
    ctx.body = ctx.params
});

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(PORT, HOST);