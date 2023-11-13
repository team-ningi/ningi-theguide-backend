"use strict";
//@ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const helper_1 = require("../helper");
require("mongoose-type-email");
mongoose.Promise = Promise;
const usersSchema = new mongoose.Schema({
    uuid: { type: String, index: true, unique: true },
    email: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    first_name: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    last_name: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    address_line1: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    address_line2: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    address_line3: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    address_line4: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    phone_number: { type: String, get: helper_1.decrypt, set: helper_1.encrypt },
    company: { type: String, index: true },
    role: { type: String, default: "readOnly" },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    superUser: { type: Boolean, default: false },
    created_at: { type: Date },
    updated_at: { type: Date },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
        getters: true,
        setters: true,
    },
    toObject: {
        getters: true,
        setters: true,
    },
});
usersSchema.index({ email: 1 }, { unique: true });
module.exports = {
    usersModel: mongoose.model("Users", usersSchema),
};
