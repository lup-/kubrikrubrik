const { Telegraf } = require('telegraf');

const getKubrikBot = require('./modules/KubrikBot');
let kubrikBot;
let botPromise = getKubrikBot(process.env.CHAT_ID, process.env.BOT_TOKEN, process.env.IMGBB_TOKEN);
const bot = new Telegraf(process.env.BOT_TOKEN)

async function makeTopicMenu(parentId = null, hasBack = false) {
    let topics = await kubrikBot.getTopicsForParent(parentId);
    const buttonColumns = kubrikBot.getSettings('buttonColumns');

    const menu = Telegraf.Extra
        .markdown()
        .markup((m) => {
            let buttons = topics.map(topic => {
                let buttonAction = `goto_${topic.id}`;
                let buttonText = topic.name;

                return m.callbackButton(buttonText, buttonAction);
            });

            let buttonRows = buttons.reduce( (rows, button) => {
                let lastRow = rows[rows.length-1];
                if (lastRow.length < buttonColumns) {
                    lastRow.push(button);
                }
                else {
                    lastRow = [button];
                    rows.push(lastRow);
                }

                return rows;
            }, [ [] ]);

            let navigationRow = []

            if (parentId) {
                navigationRow.push(m.callbackButton(kubrikBot.getSettings('homeButtonText'), 'home'));
                navigationRow.push(m.callbackButton(kubrikBot.getSettings('linksButtonText'), `show_${parentId}`));
            }
            else {
                navigationRow.push(m.callbackButton(kubrikBot.getSettings('searchButtonText'), `search`));
                navigationRow.push(m.callbackButton(kubrikBot.getSettings('randomButtonText'), 'random'));
            }

            if (hasBack) {
                navigationRow.push(m.callbackButton(kubrikBot.getSettings('backButtonText'), 'back'));
            }


            if (navigationRow.length > 0) {
                buttonRows.push(navigationRow);
            }

            return m.inlineKeyboard(buttonRows);
        });

    return menu;
}

function makePostList(posts) {
    if (!posts || posts.length === 0) {
        return kubrikBot.getMessage('notFoundMessage');
    }

    let postsList = posts.map(post => kubrikBot.getMessage('postsListRowMessage', post)).join('\n');
    return `${kubrikBot.getMessage('postsListMessage')}${postsList}`;
}

function makeRootMenu() {
    return makeTopicMenu();
}

bot.start(async (ctx) => {
    const chatInfo = ctx.update.message.chat;
    await kubrikBot.saveChat(chatInfo);

    let rootMenu = await makeRootMenu();
    ctx.reply( kubrikBot.getMessage('homeMessage'), rootMenu );
});

bot.command('reload', async ctx => {
    await kubrikBot.reloadSettings();
    ctx.reply( kubrikBot.getMessage('reloadMessage') );
});
bot.command('ping', ctx => ctx.reply('Уйди постылый, я в печали!'));

bot.command('search', ctx => ctx.reply( kubrikBot.getMessage('searchMessage'), Telegraf.Extra.markdown() ))
bot.action('search', ctx => ctx.reply( kubrikBot.getMessage('searchMessage'), Telegraf.Extra.markdown() ))

bot.action('home', async (ctx) => {
    let rootMenu = await makeRootMenu();
    //ctx.session.path = [];
    return ctx.editMessageText( kubrikBot.getMessage('homeMessage'), rootMenu );
});

bot.action( /^goto_(.+)/, async (ctx) => {
    let parentId = ctx.match[1];
    //let hasBack = ctx.session.path.length > 0;
    let hasBack = false;
    let topic = await kubrikBot.getTopic(parentId);
    let menu = await makeTopicMenu(parentId, hasBack);

    if (!topic) {
        let rootMenu = await makeRootMenu();
        return ctx.editMessageText( kubrikBot.getMessage('homeMessage'), rootMenu );
    }

    return ctx.editMessageText( kubrikBot.getMessage('topicMessage', topic), menu);
});

bot.action( /^show_(.+)/, async (ctx) => {
    let parentId = ctx.match[1];
    //let hasBack = ctx.session.path.length > 0;
    let hasBack = false;
    let topic = await kubrikBot.getTopic(parentId);
    let menu = await makeTopicMenu(parentId, hasBack);
    let posts = await kubrikBot.getPosts([parentId]);

    return ctx.reply( makePostList(posts), Telegraf.Extra.markdown() )
                .then(() => ctx.reply(topic
                    ? kubrikBot.getMessage('topicMessage', topic)
                    : kubrikBot.getMessage('homeMessage'), menu, Telegraf.Extra.markdown() ));
});

bot.action( /^random_(.+)/, async (ctx) => {
    let parentId = ctx.match[1] || null;
    let topic = parentId ? await kubrikBot.getTopic(parentId) : false;
    let menu = await makeTopicMenu(parentId, false);

    let post = await kubrikBot.randomPost();

    return ctx.reply( kubrikBot.getMessage('randomPostMessage', post), Telegraf.Extra.markdown())
                .then(() => ctx.reply(topic
                    ? kubrikBot.getMessage('topicMessage', topic)
                    : kubrikBot.getMessage('homeMessage'), menu, Telegraf.Extra.markdown() ));
});

bot.action( 'random', async (ctx) => {
    let post = await kubrikBot.randomPost();
    let rootMenu = await makeRootMenu();

    return ctx.reply( kubrikBot.getMessage('randomPostMessage', post), Telegraf.Extra.markdown())
        .then(() => ctx.reply( kubrikBot.getMessage('homeMessage'), rootMenu, Telegraf.Extra.markdown() ));
});

bot.action('back', async (ctx) => {
    //let hasBackNow = ctx.session.path.length > 0;
    let hasBackNow = false;
    let menu;
    let title;

    if (hasBackNow) {
        let backId = ctx.session.path.pop();
        //let willHaveBack = ctx.session.path.length > 0;
        let willHaveBack = false;

        let topic = kubrikBot.getTopic(backId);
        menu = await makeTopicMenu(backId, willHaveBack);
        title = kubrikBot.getMessage('topicMessage', topic);
    }
    else {
        title = kubrikBot.getMessage('homeMessage');
        menu = await makeRootMenu();
    }

    return ctx.editMessageText( title, menu );
});

bot.on('text', async (ctx) => {
    let query = ctx.message.text;
    let posts = await kubrikBot.searchPostsByText(query);
    let rootMenu = await makeRootMenu();
    return ctx.reply( makePostList(posts), rootMenu, Telegraf.Extra.markdown() );
});

botPromise.then(initedBot => {
    kubrikBot = initedBot;
    bot.launch();
})
