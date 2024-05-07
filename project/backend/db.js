const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient

const connectionString = 'mongodb://localhost:27017/shop'

let _db

const initDB = async (callback) => {
    if (_db) {
        console.log('Database is already initialized')
        return callback(null, _db)
    }

    try {
        const client = await MongoClient.connect(connectionString, {})
        _db = client.db()
    } catch (e) {
        callback(err)
    }
}

const init = async () => {
    if (_db) {
        console.log('Database is already initialized')
        return
    }

    try {
        const client = await MongoClient.connect(connectionString, {})
        _db = client
    } catch (e) {
        throw new Error('Failed to connect DB')
    }
}

const getDB = () => {
    if (!_db) {
        throw new Error('Database not initialized')
    }
    return _db
}

module.exports = {
    init,
    getDB,
}
