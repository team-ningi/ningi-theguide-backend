"use strict";
//@ts-nocheck
const { auditModel: Audit } = require("./audit-model");
module.exports = (payload) => Audit.create(payload);
