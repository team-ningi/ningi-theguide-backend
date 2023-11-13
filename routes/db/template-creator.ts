//@ts-nocheck

const { templateModel: Template } = require("./template-model");

module.exports = (payload) => Template.create(payload);
