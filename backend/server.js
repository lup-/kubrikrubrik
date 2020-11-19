'use strict';

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const multer = require('koa-multer');
const upload = multer({ storage: multer.memoryStorage() });

const topic = require('./routes/topic');
const message = require('./routes/message');
const settings = require('./routes/settings');

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
    .post('/api/message', upload.array('image'), message.save)
    .post('/api/message/list', message.list)
    .post('/api/message/delete', message.delete)
    .post('/api/message/send', upload.array('image'), message.send);

router
    .get('/api/settings', settings.load)
    .post('/api/settings', settings.save);

app
    .use(bodyParser({
        formLimit: '50mb',
        jsonLimit: '1mb',
    }))
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(PORT, HOST);