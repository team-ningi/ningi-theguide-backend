"use strict";
//@ts-nocheck
const mongoose = require("mongoose");
mongoose.Promise = Promise;
const tagsSchema = new mongoose.Schema({
    user_id: { type: String, index: true },
    label: { type: String, index: true, unique: true },
    tags: { type: Array },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
module.exports = {
    tagsModel: mongoose.model("Tags", tagsSchema),
};
