//@ts-nocheck

const mongoose = require("mongoose");

mongoose.Promise = Promise;

const documentSchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true },
    label: { type: String },
    file_url: { type: String },
    file_type: { type: String, index: true },
    original_filename: { type: String, index: true },
    saved_filename: { type: String, index: true },
    custom_filename: { type: String, index: true },
    type_of_embedding: { type: String, default: "document" },
    image_to_text_content: { type: String, default: "" },
    image_to_text_content_original: { type: String, default: "" },
    additional_context: { type: String, default: "" },
    embedding_created: { type: Boolean, default: false },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = {
  documentModel: mongoose.model("Document", documentSchema),
};
