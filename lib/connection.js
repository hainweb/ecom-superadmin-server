const { MongoClient } = require("mongodb");

const state = { db: null };

module.exports.connect = async function (done) {
  try {
    const url = process.env.MONGODB_URL || "mongodb://localhost:27017";
    const dbname = process.env.DB_NAME || "shopping";

    const client = await MongoClient.connect(url);
    state.db = client.db(dbname);
    done();
  } catch (error) {
    done(error);
  }
};

module.exports.get = function () {
  return state.db;
};
