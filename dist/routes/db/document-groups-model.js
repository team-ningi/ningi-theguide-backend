"use strict";
//@ts-nocheck
const mongoose = require("mongoose");
mongoose.Promise = Promise;
const documentGroupsSchema = new mongoose.Schema({
    user_id: { type: String, index: true },
    label: { type: String, unique: true },
    document_ids: { type: Array },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
module.exports = {
    documentGroupsModel: mongoose.model("DocumentGroups", documentGroupsSchema),
};
