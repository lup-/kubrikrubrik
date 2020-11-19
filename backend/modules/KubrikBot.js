const Markup = require('telegraf/markup');
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
    'notSubscribed': 'Чтобы увидеть скрытое сообщение, нужно подписаться на канал',
    'errorMessage': 'Что-то пошло не так'
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

        async getPostByMessageId(telegramId) {
            const db = await getDb();
            const messages = db.collection('messages');

            let post = false;
            try {
                post = await messages.findOne({telegramId});
            }
            catch (e) {}

            return post;
        },

        async getHiddenMessageForPost(messageId, chatId, userId) {
            let subscriber = await telegram.getChatMember(chatId, userId);
            let isSubscriber = subscriber && subscriber.status && ["creator", "administrator", "member"].indexOf(subscriber.status) !== -1;

            if (!isSubscriber) {
                return this.getMessage('notSubscribed');
            }

            let post = await this.getPostByMessageId(messageId);
            let button = post && post.button;
            return button && button.message
                ? button.message
                : this.getMessage('errorMessage');
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

        escapeMarkdownToHTML(text) {
            //см. https://core.telegram.org/bots/api#markdownv2-style

            let pairedSymbols = [
                {from: '*', to: '<b>$1</b>'},
                {from: '__', to: '<u>$1</u>'},
                {from: '_', to: '<i>$1</i>'},
                {from: '~', to: '<s>$1</s>'},
                {from: '```', to: '<pre>$1</pre>'},
                {from: '`', to: '<code>$1</code>'},
            ];

            let safeText = text;
            for (const replacement of pairedSymbols) {
                let fromRegexp = new RegExp("\\"+replacement.from+"(.*?)\\"+replacement.from, 'gms');
                let toExp = replacement.to;

                safeText = safeText.replace( new RegExp("\\\\\\"+replacement.from, 'g'), ':%mask%:' );
                safeText = safeText.replace( fromRegexp, toExp );
                safeText = safeText.replace( /:%mask%:/g, replacement.from );
            }

            safeText = safeText.replace(/\[(.*?)\]\((.*?)\)/gms, '<a href="$2">$1</a>');

            return safeText;
        },

        getTextWithImage(text, imageData) {
            text = this.escapeMarkdownToHTML(text);

            if (!imageData) {
                return text;
            }

            const emptyChar = '‎';
            let imageUrl = imageData.url;

            text = `<a href="${imageUrl}">${emptyChar}</a> ${text}`;
            return text;
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

        ensureTopicsArray(topicIds) {
            if (topicIds instanceof Array) {
                return topicIds;
            }

            if (typeof(topicIds) === 'string') {
                if (topicIds.indexOf(',') !== -1) {
                    return topicIds.split(/\s*,\s*/);
                }
                else {
                    return [topicIds];
                }
            }

            return [];
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
        async sendMessage(name, text, button, topicIds, options = {}) {
            const defaultOptions = {};

            let imageData = false;
            let apiMessage = false;
            let mediaGroup = false;

            options = Object.assign(defaultOptions, options);
            options.parse_mode = 'HTML';

            if (button) {
                let keyboard = Markup.inlineKeyboard([
                    Markup.callbackButton(button.text, 'hidden_action')
                ]).extra();
                options = Object.assign(options, keyboard);
            }

            if (options['attach_link_image']) {
                imageData = options['attach_link_image'];
                delete options['attach_link_image'];

                let textToTelegram = this.getTextWithImage(text, imageData);
                apiMessage = await telegram.sendMessage(chatId, textToTelegram, options);
                imageData = apiMessage.photo;
            }
            else if (options['attach_image']) {
                let uploadedImage = options['attach_image'];
                delete options['attach_image'];
                options['caption'] = this.getTextWithImage(text, false);

                apiMessage = await telegram.sendPhoto(chatId, {source: uploadedImage.buffer}, options);
                imageData = apiMessage.photo;
            }
            else if (options['attach_album']) {
                let uploadedImages = options['attach_album'];
                delete options['attach_album'];

                let media = uploadedImages.map(image => {
                    return {media: {source: image.buffer}, type: 'photo'};
                });

                let mediaGroup = [];
                let hasKeyboard = Boolean(options.reply_markup);
                if (hasKeyboard) {
                    mediaGroup = await telegram.sendMediaGroup(chatId, media, options);
                    let textToTelegram = this.getTextWithImage(text, false);
                    apiMessage = await telegram.sendMessage(chatId, textToTelegram, options);
                }
                else {
                    media[0]['caption'] = this.getTextWithImage(text, false);
                    mediaGroup = await telegram.sendMediaGroup(chatId, media, options);
                    apiMessage = mediaGroup[0];
                }

                imageData = mediaGroup.reduce((files, message) => {
                    return files.concat(message.photo || []);
                }, []);
            }
            else {
                let textToTelegram = this.getTextWithImage(text, imageData);
                apiMessage = await telegram.sendMessage(chatId, textToTelegram, options);
            }

            return this.saveMessage(name, button, topicIds, apiMessage, imageData, mediaGroup, options);
        },
        async saveMessage(name, button, topicIds, apiMessage, imageData = false, mediaGroup = false, options = {}) {
            const db = await getDb();
            const messages = db.collection('messages');

            let chatLinkId = chatId.replace('@', '');
            let text = apiMessage.text;

            let message = {
                id: shortid.generate(),
                telegramId: apiMessage.message_id,
                chatId,
                name,
                text,
                button,
                imageData,
                mediaGroup,
                parseMode: options['parse_mode'],
                url: `https://t.me/${chatLinkId}/${apiMessage.message_id}`,
                topics: this.ensureTopicsArray(topicIds),
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