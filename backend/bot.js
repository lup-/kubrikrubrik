const { Telegraf } = require('telegraf');
const getKubrikBot = require('./modules/KubrikBot');
const kubrikBot = getKubrikBot(process.env.BOT_TOKEN);

const HomeText = 'Выбери себе';
const ButtonColumns = 2;

const bot = new Telegraf(process.env.BOT_TOKEN)

async function makeTopicMenu(parentId = null, hasBack = false) {
    let topics = await kubrikBot.getTopicsForParent(parentId);

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
                if (lastRow.length < ButtonColumns) {
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
                navigationRow.push(m.callbackButton('Домой', 'home'));
                navigationRow.push(m.callbackButton('Показать ссылки', `show_${parentId}`));
            }

            if (hasBack) {
                navigationRow.push(m.callbackButton('Назад', 'back'));
            }

            if (navigationRow.length > 0) {
                buttonRows.push(navigationRow);
            }

            return m.inlineKeyboard(buttonRows);
        });

    return menu;
}

function makeRootMenu() {
    return makeTopicMenu();
}

bot.command('start', async (ctx) => {
    let rootMenu = await makeRootMenu();
    //ctx.session.path = [];

    ctx.reply( HomeText, rootMenu );
});

bot.action('home', async (ctx) => {
    let rootMenu = await makeRootMenu();
    //ctx.session.path = [];
    return ctx.editMessageText( HomeText, rootMenu );
});

bot.action( /^goto_(.+)/, async (ctx) => {
    // if (!ctx.session.path) {
    //     ctx.session.path = [];
    // }

    let parentId = ctx.match[1];
    //let hasBack = ctx.session.path.length > 0;
    let hasBack = false;
    let topic = await kubrikBot.getTopic(parentId);
    let menu = await makeTopicMenu(parentId, hasBack);

    if (!topic) {
        let rootMenu = await makeRootMenu();
        return ctx.editMessageText( HomeText, rootMenu );
    }

    return ctx.editMessageText( topic.name, menu);
});

bot.action( /^show_(.+)/, async (ctx) => {
    let parentId = ctx.match[1];
    //let hasBack = ctx.session.path.length > 0;
    let hasBack = false;
    let menu = await makeTopicMenu(parentId, hasBack);
    let posts = await kubrikBot.getPosts([parentId]);

    let postsList = "Посты не найдены";
    if (posts.length > 0) {
        postsList = posts.map(post => `- [${post.name}](${post.url})`).join('\n');
    }

    return ctx.reply( `*Посты*:\n${postsList}`, menu );
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
        title = topic.name;
    }
    else {
        title = HomeText;
        menu = await makeRootMenu();
    }

    return ctx.editMessageText( title, menu );
});

bot.launch();