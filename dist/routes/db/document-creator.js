"use strict";
//@ts-nocheck
const { documentModel: Document } = require("./document-model");
module.exports = (payload) => Document.create(payload);
