//@ts-nocheck

const { reportsModel: Reports } = require("./reports-model");

module.exports = (payload) => Reports.create(payload);
