const getDb = require('../modules/Database');
const moment = require('moment');
const getKubrikBot = require('../modules/KubrikBot');
const kubrikBot = getKubrikBot(process.env.BOT_TOKEN);

module.exports = {
    async load(ctx, next) {
        const id = ctx.params.id;

        if (!id) {
            ctx.body = {message: false};
            return next();
        }

        const db = await getDb();
        const messages = db.collection('messages');
        let message = await messages.findOne({id});

        if (!message) {
            ctx.body = {message: false};
            return next();
        }

        ctx.body = {message};
        return next();
    },
    async list(ctx, next) {
        let filter = ctx.request.body && ctx.request.body.filter
            ? ctx.request.body.filter || {}
            : {};
        let defaultFilter = {
            deleted: {$in: [null, false]},
        };

        const db = await getDb();
        filter = Object.assign(defaultFilter, filter);

        const messages = db.collection('messages');
        let filteredMessages = await messages.find(filter).toArray();

        ctx.body = {messages: filteredMessages};
        return next();
    },
    async save(ctx, next) {
        const db = await getDb();
        const messages = db.collection('messages');

        let messageFields = ctx.request.body.message;
        let messageText = messageFields.text;

        if (!messageFields.id) {
            messageFields.id = shortid.generate();
        }

        const id = messageFields.id;
        let isNew = !Boolean(id);

        if (messageFields._id) {
            delete messageFields._id;
        }

        if (!isNew) {
            try {
                let updatedApiMessage = kubrikBot.updateMessage(messageFields.telegramId, messageText);
                messageFields.apiMessage = updatedApiMessage;
            }
            catch (e) {}
        }

        let updateResult = await messages.findOneAndReplace({id}, messageFields, {upsert: true, returnOriginal: false});
        let message = updateResult.value || false;

        ctx.body = {message};
        return next();
    },
    async delete(ctx, next) {
        const id = ctx.request.body.id;

        if (!id) {
            ctx.body = {message: false};
            return next();
        }

        const db = await getDb();
        const messages = db.collection('messages');
        let messageFields = await messages.findOne({id});

        messageFields = Object.assign(messageFields, {
            deleted: true,
            dateDeleted: moment().toISOString(),
        });

        let updateResult = await messages.findOneAndReplace({id}, messageFields, {returnOriginal: false});
        let message = updateResult.value || false;

        try {
            await kubrikBot.deleteMessage(messageFields.telegramId);
        }
        catch (e) {}

        ctx.body = {message};
        return next();
    },
    async send(ctx, next) {
        const text = ctx.request.body.text;
        const name = ctx.request.body.name || '';
        const topicIds = ctx.request.body.topics;

        if (!topicIds || !text) {
            ctx.body = {sent: false};
            return next();
        }

        let message = await kubrikBot.sendMessage(name, text, topicIds);

        ctx.body = {message};
        return next();
    }
}