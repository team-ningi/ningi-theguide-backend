//@ts-nocheck

const { tagsModel: Tags } = require("./tags-model");

module.exports = (payload) => Tags.create(payload);
