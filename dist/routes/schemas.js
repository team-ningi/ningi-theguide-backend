"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.emailAddressSchema = exports.emailSchema = exports.createEmbeddingsSchema = exports.createIndexSchema = exports.idSchema = exports.questionSchema = exports.resetEmbedFlagSchema = exports.addDocumentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.addDocumentSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    label: joi_1.default.string().required().allow(""),
    file_url: joi_1.default.string().required(),
    file_type: joi_1.default.string().required(),
    saved_filename: joi_1.default.string().required(),
    original_filename: joi_1.default.string().required(),
    custom_filename: joi_1.default.string().required().allow(""),
    metadata: joi_1.default.object().optional(),
});
exports.resetEmbedFlagSchema = joi_1.default.object({
    embed_flag: joi_1.default.boolean().required(),
    document_id: joi_1.default.string().required(),
});
exports.questionSchema = joi_1.default.object({
    question: joi_1.default.string().required(),
    documentIds: joi_1.default.array().optional(),
});
exports.idSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
});
exports.createIndexSchema = joi_1.default.object({
    index_name: joi_1.default.string().required(),
    vector_dimension: joi_1.default.number().required(),
});
exports.createEmbeddingsSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    document_url: joi_1.default.string().required(),
    document_id: joi_1.default.string().required(),
    file_type: joi_1.default.string().required(),
});
exports.emailSchema = joi_1.default.object({
    email: joi_1.default.string().required(),
});
exports.emailAddressSchema = joi_1.default.object({
    email_address: joi_1.default.string().required(),
});
exports.updateUserSchema = joi_1.default.object({
    email_address: joi_1.default.string().required(),
    first_name: joi_1.default.string().optional(),
    last_name: joi_1.default.string().optional(),
    phone_number: joi_1.default.string().optional(),
    address_line1: joi_1.default.string().optional(),
    address_line2: joi_1.default.string().optional(),
    address_line3: joi_1.default.string().optional(),
    address_line4: joi_1.default.string().optional(),
    role: joi_1.default.string().optional(),
    company: joi_1.default.string().optional(),
    metadata: joi_1.default.object().optional(),
});
