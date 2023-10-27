//@ts-nocheck

const mongoose = require("mongoose");

mongoose.Promise = Promise;

const auditSchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true },
    action: { type: String, index: true },
    metadata: { type: mongoose.SchemaTypes.Mixed },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = {
  auditModel: mongoose.model("Audit", auditSchema),
};
