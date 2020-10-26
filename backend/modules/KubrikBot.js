const Telegram = require('telegraf/telegram');
const imgbbUploader = require('imgbb-uploader');
const getDb = require('./Database');
const makeTree = require('../modules/makeTree');
const shortid = require('shortid');
const moment = require('moment');
const tempWrite = require('temp-write');
const fs = require('fs');

let botInstance = false;

const defaultSettings = {
    'buttonColumns': 2,
    'defaultParseMode': 'MarkdownV2',

    'homeButtonText': '🏠 Домой',
    'linksButtonText': '📖 Показать ссылки',
    'randomButtonText': '\u2728 Наудачу',
    'backButtonText': '\u2b05 Назад',
    'searchButtonText': '🔍 Поиск',

    'reloadMessage': 'Перегрузил настройки',
    'homeMessage': 'Выбери рубрику',
    'topicMessage': 'Тема "%name%"',
    'notFoundMessage': 'Посты не найдены',
    'postsListMessage': '*Посты*:\n',
    'postsListRowMessage': '- [%name%](%url%)',
    'randomPostMessage': '*Случайный пост*:\n[%name%](%url%)',
    'searchMessage': 'Отправь мне сообщение и я всегда найду подходящие ссылки:',
};

async function loadSettings() {
    const db = await getDb();
    const settingsStore = db.collection('settings');
    let loadedSettings = await settingsStore.find({}).toArray();
    if (loadedSettings.length === 0) {
        loadedSettings = [{}];
    }
    return Object.assign(defaultSettings, loadedSettings[0]);
}

function KubrikBot(chatId, telegramToken, imgbbToken, settings) {
    const telegram = new Telegram(telegramToken);

    return {
        loadSettings,

        async reloadSettings() {
            const db = await getDb();
            db.refreshInstance();

            settings = await loadSettings(settings);
        },

        async saveSettings(newSettings) {
            const db = await getDb();
            const settingsStore = db.collection('settings');
            let filter = {};
            let settingsToSave = Object.assign(settings, newSettings);

            if (settingsToSave) {
                filter = {'_id': settingsToSave['_id']};
                delete settingsToSave['_id'];
            }

            let updateResult = await settingsStore.findOneAndReplace(filter, settingsToSave, {upsert: true, returnOriginal: false});

            return updateResult.value || false;
        },

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

            let allTopics = await topics.find({
                deleted: {$in: [null, false]},
            }).toArray();
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

        async uploadImage(imageBuffer) {
            let uploadedImage = false;

            try {
                const imagePath = tempWrite.sync(imageBuffer);
                uploadedImage = await imgbbUploader(imgbbToken, imagePath);
                fs.unlinkSync(imagePath);
            }
            catch (e) {}

            return uploadedImage;
        },

        getTextWithImage(text, imageData, parseMode) {
            if (parseMode.toLocaleLowerCase().indexOf('markdown') !== -1) {
                text = text.replace(/([\.\?\!\-])/g, "\\$1");
            }

            if (!imageData) {
                return text;
            }

            const emptyChar = '‎';
            let imageUrl = imageData.url;

            text += parseMode.toLocaleLowerCase() === 'html'
                ? `<a href="${imageUrl}>${emptyChar}</a>`
                : `[${emptyChar}](${imageUrl})`;

            return text
        },

        async updateMessage(messageId, text, options = {}) {
            let textToTelegram = this.getTextWithImage(text, options['attach_image'] || false, options['parse_mode'] || settings.defaultParseMode);
            if (options['attach_image']) {
                delete options['attach_image'];
            }
            return telegram.editMessageText(chatId, messageId, null, textToTelegram, options);
        },

        async deleteMessage(messageId) {
            return telegram.deleteMessage(chatId, messageId);
        },

        /**
         *
         * @param name
         * @param text
         * @param topicIds
         * @param options {disable_web_page_preview: true|false, disable_notification: true|false, parse_mode: MarkdownV2|HTML}
         *                  https://core.telegram.org/bots/api#formatting-options
         * @returns {Promise<*|boolean>}
         */
        async sendMessage(name, text, topicIds, options = {}) {
            const db = await getDb();
            const messages = db.collection('messages');
            const defaultOptions = {
                'parse_mode': settings.defaultParseMode,
            };
            let imageData = false;

            options = Object.assign(defaultOptions, options);
            if (options['attach_image']) {
                imageData = options['attach_image'];
                delete options['attach_image'];
            }

            let textToTelegram = this.getTextWithImage(text, imageData, options['parse_mode']);
            let apiMessage = await telegram.sendMessage(chatId, textToTelegram, options);
            let chatLinkId = chatId.replace('@', '');

            let message = {
                id: shortid.generate(),
                telegramId: apiMessage.message_id,
                chatId,
                name,
                text,
                imageData,
                parseMode: options['parse_mode'],
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

async function getInstance(chatId, telegramToken, imgBBToken) {
    if (botInstance) {
        return botInstance;
    }

    const CHAT_ID = chatId || process.env.CHAT_ID;
    const BOT_TOKEN = telegramToken || process.env.BOT_TOKEN;
    const IMGBB_TOKEN = imgBBToken || process.env.IMGBB_TOKEN;

    const settings = await loadSettings(defaultSettings);

    botInstance = new KubrikBot(CHAT_ID, BOT_TOKEN, IMGBB_TOKEN, settings);
    return botInstance;
}

module.exports = getInstance;