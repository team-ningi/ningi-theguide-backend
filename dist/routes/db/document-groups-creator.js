"use strict";
//@ts-nocheck
const { documentGroupsModel: DocumentGroups, } = require("./document-groups-model");
module.exports = (payload) => DocumentGroups.create(payload);
