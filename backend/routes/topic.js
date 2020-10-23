const getDb = require('../modules/Database');
const shortid = require('shortid');
const moment = require('moment');
const makeTree = require('../modules/makeTree');

module.exports = {
    async load(ctx, next) {
        const id = ctx.params.id;

        if (!id) {
            ctx.body = {topic: false};
            return next();
        }

        const db = await getDb();
        const topics = db.collection('topics');
        let topic = await topics.findOne({id});

        if (!topic) {
            ctx.body = {topic: false};
            return next();
        }

        ctx.body = {topic};
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

        const topics = db.collection('topics');
        let filteredTopics = await topics.find(filter).toArray();
        let allTopics = await topics.find(defaultFilter).toArray();

        let foundTree = makeTree(allTopics).filter(treeTopTopic => filteredTopics.findIndex(topic => topic.id === treeTopTopic.id) !== -1);

        ctx.body = {topics: filteredTopics, topicsTree: foundTree};
        return next();
    },
    async save(ctx, next) {
        const db = await getDb();
        const topics = db.collection('topics');

        let topicFields = ctx.request.body.topic;
        if (!topicFields.id) {
            topicFields.id = shortid.generate();
        }

        const id = topicFields.id;

        if (topicFields._id) {
            delete topicFields._id;
        }

        let updateResult = await topics.findOneAndReplace({id}, topicFields, {upsert: true, returnOriginal: false});
        let topic = updateResult.value || false;

        ctx.body = {topic};
        return next();
    },
    async delete(ctx, next) {
        const id = ctx.request.body.id;

        if (!id) {
            ctx.body = {topic: false};
            return next();
        }

        const db = await getDb();
        const topics = db.collection('topics');
        let topicFields = await topics.findOne({id});

        topicFields = Object.assign(topicFields, {
            deleted: true,
            dateDeleted: moment().toISOString(),
        });

        let updateResult = await topics.findOneAndReplace({id}, topicFields, {returnOriginal: false});
        let topic = updateResult.value || false;

        ctx.body = {topic};
        return next();
    }
}