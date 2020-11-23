const getDb = require('../modules/Database');
const moment = require('moment');
const getKubrikBot = require('../modules/KubrikBot');

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
        const kubrikBot = await getKubrikBot(process.env.CHAT_ID, process.env.BOT_TOKEN, process.env.IMGBB_TOKEN);

        let messageFields = JSON.parse(ctx.req.body.message) || {};
        let buttonFields = ctx.req.body.button && ctx.req.body.button !== 'false'
            ? JSON.parse(ctx.req.body.button) || false
            : false;
        let messageText = messageFields.text;

        const id = messageFields.id;
        let isNew = !Boolean(id);

        if (!isNew) {
            messageFields = await messages.findOne({id}).toArray();
            messageFields.text = messageText;
            messageFields.button = buttonFields;
        }

        if (!messageFields.id) {
            messageFields.id = shortid.generate();
        }

        if (messageFields._id) {
            delete messageFields._id;
        }

        messageFields.topics = kubrikBot.ensureTopicsArray(messageFields.topics);

        let updateResult = await messages.findOneAndReplace({id}, messageFields, {upsert: true, returnOriginal: false});
        let message = updateResult.value || false;

        ctx.body = {message};
        return next();
    },
    async delete(ctx, next) {
        const id = ctx.request.body.id;
        const kubrikBot = await getKubrikBot(process.env.CHAT_ID, process.env.BOT_TOKEN, process.env.IMGBB_TOKEN);

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
        const kubrikBot = await getKubrikBot(process.env.CHAT_ID, process.env.BOT_TOKEN, process.env.IMGBB_TOKEN);
        const text = ctx.req.body.text;
        const name = ctx.req.body.name || '';
        const topicIds = ctx.req.body.topics;
        const uploadedImages = ctx.req.files;
        let button = ctx.req.body.buttonText !== 'false'
            ? {
                text: ctx.req.body.buttonText,
                message: ctx.req.body.buttonMessage !== 'false' ? ctx.req.body.buttonMessage : false,
                url: ctx.req.body.buttonUrl !== 'false' ? ctx.req.body.buttonUrl : false,
            }
            : false;

        const sendAsLink = ctx.req.body.asLink === "true"  || ctx.req.body.asLink === true || false;
        let uploadedImage = uploadedImages ? uploadedImages[0] : false;

        let options = {};

        if (sendAsLink && uploadedImage && uploadedImages.length === 1) {
            let hosting = await kubrikBot.uploadImage(uploadedImage.buffer);

            let file = {
                name: uploadedImage.originalname,
                type: uploadedImage.mimetype,
                size: uploadedImage.size,
                url: hosting.url,
                hosting,
            }

            options['attach_link_image'] = file;
        }
        else if (uploadedImage && uploadedImages.length === 1) {
            options['attach_image'] = uploadedImage;
        }
        else if (uploadedImages && uploadedImages.length > 1) {
            options['attach_album'] = uploadedImages;
        }

        if (!topicIds || !text) {
            ctx.body = {sent: false};
            return next();
        }

        let message = await kubrikBot.sendMessage(name, text, button, topicIds, options);

        ctx.body = {message};
        return next();
    }
}