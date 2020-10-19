const MongoClient = require('mongodb').MongoClient;
const DB_HOST = process.env.MONGO_HOST;
const DB_NAME = process.env.MONGO_DB;
const DB_PORT = process.env.MONGO_PORT || 27017;
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

let dbInstance = false;

module.exports = async function () {
    if (dbInstance) {
        return dbInstance;
    }

    let client = await MongoClient.connect(DB_URL, {useNewUrlParser: true});
    dbInstance = client.db(DB_NAME);

    return dbInstance;
}