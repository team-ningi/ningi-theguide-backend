"use strict";
//@ts-nocheck
const mongoose = require("mongoose");
mongoose.Promise = Promise;
const reportsSchema = new mongoose.Schema({
    user_id: { type: String, index: true },
    report_name: { type: String, index: true },
    report_type: { type: String, index: true },
    file_type: { type: String, index: true },
    base_template_url: { type: String },
    generated_report_url: { type: String },
    tags: { type: Array },
    tagResults: { type: Array },
    document_ids: { type: Array },
    report_hidden: { type: Boolean, default: false },
    generated_report: { type: Boolean, default: false },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
module.exports = {
    reportsModel: mongoose.model("Report", reportsSchema),
};
