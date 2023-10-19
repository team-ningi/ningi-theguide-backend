//@ts-nocheck

const mongoose = require("mongoose");

mongoose.Promise = Promise;

const subSchema = new mongoose.Schema({
  document_ids: Array,
  question: String,
  answer: String,
});

const chatHistorySchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true },
    history: [subSchema],
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = {
  chatHistoryModel: mongoose.model("ChatHistory", chatHistorySchema),
};
