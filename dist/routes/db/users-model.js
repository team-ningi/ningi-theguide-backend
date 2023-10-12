"use strict";
//@ts-nocheck
const mongoose = require("mongoose");
require("mongoose-type-email");
mongoose.Promise = Promise;
const usersSchema = new mongoose.Schema({
    email: { type: mongoose.SchemaTypes.Email, index: true },
    first_name: { type: String },
    last_name: { type: String },
    address_line1: { type: String },
    address_line2: { type: String },
    address_line3: { type: String },
    address_line4: { type: String },
    phone_number: { type: String },
    company: { type: String, index: true },
    role: { type: String, default: "readOnly" },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
usersSchema.index({ email: 1 }, { unique: true });
module.exports = {
    usersModel: mongoose.model("Users", usersSchema),
};
