const Telegram = require('telegraf/telegram');
const getDb = require('./Database');
const makeTree = require('../modules/makeTree');
const shortid = require('shortid');
const moment = require('moment');
const chatId = process.env.CHAT_ID;

let botInstance = false;

function KubrikBot(token) {
    const telegram = new Telegram(token);
    const settings = {
        'buttonColumns': 2,

        'homeButtonText': '🏠 Домой',
        'linksButtonText': '📖 Ссылки',
        'randomButtonText': '\u2728 Наудачу',
        'backButtonText': '\u2b05 Назад',
        'searchButtonText': '🔍 Поиск',

        'homeMessage': 'Выбери себе',
        'topicMessage': 'Тема "%name%"',
        'notFoundMessage': 'Посты не найдены',
        'postsListMessage': '*Посты*:\n',
        'postsListRowMessage': '- [%name%](%url%)',
        'randomPostMessage': '*Случайный пост*:\n[%name%](%url%)',
        'searchMessage': 'Отправь мне сообщение и я всегда найду подходящие ссылки:',
    };

    return {
        getSettings(code = false) {
            if (!code) {
                return settings;
            }

            return settings[code];
        },

        getMessage(code, data = {}) {
            let template = this.getSettings(code);
            for (const key in data) {
                const value = data[key];
                template = template.replace(`%${key}%`, value);
            }

            return template;
        },

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

        async searchPostsByText(text) {
            const db = await getDb();
            const messages = db.collection('messages');

            try {
                await messages.createIndex( { name: "text", text: "text" } );
            }
            catch (e) {}

            let foundMessages = await messages.find({ $text: { $search: text } }).toArray();

            return foundMessages;
        },

        async randomPost(topicIds = null) {
            const db = await getDb();
            const messages = db.collection('messages');
            let randomMessage;

            if (topicIds) {
                randomMessage = await messages.aggregate([
                    { $match: {
                            topics: { $elemMatch: {$in: topicIds} },
                            deleted: {$in: [null, false]}
                        }
                    },
                    { $sample: { size: 1 } }
                ]).toArray();
            }
            else {
                randomMessage = await messages.aggregate([
                    { $match: {
                            deleted: {$in: [null, false]}
                        }
                    },
                    { $sample: { size: 1 } }
                ]).toArray();
            }

            return randomMessage[0];
        },

        async updateMessage(messageId, text) {
            return telegram.editMessageText(chatId, messageId, null, text);
        },

        async deleteMessage(messageId) {
            return telegram.deleteMessage(chatId, messageId);
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

            try {
                await messages.createIndex( { name: "text", text: "text" } );
            }
            catch (e) {}

            let updateResult = await messages.findOneAndReplace({id: message.id}, message, {upsert: true, returnOriginal: false});
            return  updateResult.value || false;
        },

        async saveChat(chatFields) {
            const db = await getDb();
            const chats = db.collection('chats');
            const id = chatFields.id;

            let updateResult = await chats.findOneAndReplace({id}, chatFields, {upsert: true, returnOriginal: false});
            return updateResult.value || false;
        }
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