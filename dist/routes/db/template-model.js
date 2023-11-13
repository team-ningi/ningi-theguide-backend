"use strict";
//@ts-nocheck
const mongoose = require("mongoose");
mongoose.Promise = Promise;
const templateSchema = new mongoose.Schema({
    user_id: { type: String, index: true },
    label: { type: String },
    file_url: { type: String },
    file_type: { type: String, index: true },
    original_filename: { type: String, index: true },
    tags: { type: Array },
    saved_filename: { type: String, index: true },
    custom_filename: { type: String, index: true },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
module.exports = {
    templateModel: mongoose.model("Template", templateSchema),
};
