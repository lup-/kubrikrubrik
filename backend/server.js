'use strict';

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const topic = require('./routes/topic');
const message = require('./routes/message');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = new Koa();
const router = new Router();

router
    .get('/api/topic/:id', topic.load)
    .post('/api/topic/:id', topic.load)
    .post('/api/topic', topic.save)
    .post('/api/topic/list', topic.list)
    .post('/api/topic/delete', topic.delete);

router
    .get('/api/message/:id', message.load)
    .post('/api/message/:id', message.load)
    .post('/api/message', message.save)
    .post('/api/message/list', message.list)
    .post('/api/message/delete', message.delete)
    .post('/api/message/send', message.send);


app
    .use(bodyParser({
        formLimit: '50mb',
        jsonLimit: '1mb',
    }))
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(PORT, HOST);