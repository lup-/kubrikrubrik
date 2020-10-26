const getKubrikBot = require('../modules/KubrikBot');

module.exports = {
    async load(ctx, next) {
        const kubrikBot = await getKubrikBot(process.env.CHAT_ID, process.env.BOT_TOKEN, process.env.IMGBB_TOKEN);
        ctx.body = {settings: await kubrikBot.loadSettings()};

        return next();
    },
    async save(ctx, next) {
        const kubrikBot = await getKubrikBot(process.env.CHAT_ID, process.env.BOT_TOKEN, process.env.IMGBB_TOKEN);
        let settings = ctx.request.body.settings;

        ctx.body = {settings: await kubrikBot.saveSettings(settings)};
        return next();
    },
}