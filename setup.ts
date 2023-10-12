//@ts-nocheck

const mongoose = require("mongoose");
mongoose.Promise = Promise;

const { MONGODB_URL } = process.env; // eslint-disable-line

const setup = () => {
  try {
    mongoose.connect(MONGODB_URL, {});
    console.log("connected");
  } catch (e) {
    console.log("err ", e);
  }
};

const teardown = () => mongoose.disconnect();

module.exports = {
  setup,
  teardown,
};
