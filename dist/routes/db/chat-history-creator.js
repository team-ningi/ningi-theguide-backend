"use strict";
//@ts-nocheck
const { chatHistoryModel: ChatHistory } = require("./chat-history-model");
module.exports = (payload) => ChatHistory.create(payload);
