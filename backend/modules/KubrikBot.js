const Telegram = require('telegraf/telegram');
const getDb = require('./Database');
const makeTree = require('../modules/makeTree');
const shortid = require('shortid');
const moment = require('moment');
const chatId = process.env.CHAT_ID;

let botInstance = false;

function KubrikBot(token) {
    const telegram = new Telegram(token);

    return {
        async getTopicsForParent(parentId = null) {
            const db = await getDb();
            const topics = db.collection('topics');

            let allTopics = await topics.find({}).toArray();
            let childTopics = makeTree(allTopics, parentId);

            return childTopics;
        },

        async getTopic(id) {
            const db = await getDb();
            const topics = db.collection('topics');
            let foundTopics = await topics.find({id}).toArray();

            return foundTopics[0];
        },

        async getPosts(topicIds) {
            let filter = {
                topics: { $elemMatch: {$in: topicIds} },
                deleted: {$in: [null, false]},
            };

            const db = await getDb();
            const messages = db.collection('messages');
            let foundMessages = await messages.find(filter).toArray();

            return foundMessages;
        },

        async sendMessage(name, text, topicIds) {
            const db = await getDb();
            const messages = db.collection('messages');

            let apiMessage = await telegram.sendMessage(chatId, text);
            let chatLinkId = chatId.replace('@', '');

            let message = {
                id: shortid.generate(),
                telegramId: apiMessage.message_id,
                chatId,
                name,
                text,
                url: `https://t.me/${chatLinkId}/${apiMessage.message_id}`,
                topics: topicIds,
                apiMessage,
                sent: true,
                dateSent: moment().toISOString(),
            }

            let updateResult = await messages.findOneAndReplace({id: message.id}, message, {upsert: true, returnOriginal: false});
            return  updateResult.value || false;
        },
    }
}

function getInstance(token) {
    if (botInstance) {
        return botInstance;
    }

    const BOT_TOKEN = token || process.env.BOT_TOKEN;
    botInstance = new KubrikBot(BOT_TOKEN);
    return botInstance;
}

module.exports = getInstance;