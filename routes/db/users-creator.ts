//@ts-nocheck

const { usersModel: Users } = require("./users-model");

module.exports = (payload) => Users.create(payload);
