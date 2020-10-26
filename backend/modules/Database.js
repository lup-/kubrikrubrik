const MongoClient = require('mongodb').MongoClient;
const DB_HOST = process.env.MONGO_HOST;
const DB_NAME = process.env.MONGO_DB;
const DB_PORT = process.env.MONGO_PORT || 27017;
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

let dbInstance = false;

async function newClient() {
    let client = await MongoClient.connect(DB_URL, {useNewUrlParser: true});
    return client.db(DB_NAME);
}

module.exports = async function () {
    if (dbInstance) {
        return dbInstance;
    }

    let refreshInstance = async function () {
        dbInstance = await newClient();
        dbInstance.refreshInstance = refreshInstance;
    }

    await refreshInstance();

    return dbInstance;
}