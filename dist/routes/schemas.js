"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnPresignedURLSchema = exports.updateHistorySchema = exports.updateUserSchema = exports.emailAddressSchema = exports.emailSchema = exports.createEmbeddingsSchema = exports.createIndexSchema = exports.getReportsSchema = exports.getDocsSchema = exports.userIdSchema = exports.idSchema = exports.questionSchema = exports.generateDocxSchema = exports.resetEmbedFlagSchema = exports.updateReportSchema = exports.addReportSchema = exports.updateTagsSchema = exports.addTagsSchema = exports.addTemplateSchema = exports.addDocumentSchema = exports.addHistorySchema = exports.searchReportsSchema = exports.searchTemplatesSchema = exports.searchDocsSchema = exports.uuidAndEmailSchema = exports.uuidSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.uuidSchema = joi_1.default.object({
    uuid: joi_1.default.string().required(),
});
exports.uuidAndEmailSchema = joi_1.default.object({
    uuid: joi_1.default.string().required(),
    email: joi_1.default.string().required(),
});
exports.searchDocsSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    skip: joi_1.default.number().required(),
    limit: joi_1.default.number().required(),
    embedded: joi_1.default.any().required(),
    search: joi_1.default.string().optional(),
    file_type: joi_1.default.string().optional(),
});
exports.searchTemplatesSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    skip: joi_1.default.number().required(),
    limit: joi_1.default.number().required(),
    search: joi_1.default.string().optional(),
    file_type: joi_1.default.string().optional(),
});
exports.searchReportsSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    skip: joi_1.default.number().required(),
    report_type: joi_1.default.string().required(),
    limit: joi_1.default.number().required(),
    search: joi_1.default.string().optional(),
    file_type: joi_1.default.string().optional(),
});
exports.addHistorySchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    history: joi_1.default.array().required(),
    metadata: joi_1.default.object().optional(),
});
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
exports.addTemplateSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    label: joi_1.default.string().required().allow(""),
    file_url: joi_1.default.string().required(),
    file_type: joi_1.default.string().required(),
    saved_filename: joi_1.default.string().required(),
    original_filename: joi_1.default.string().required(),
    custom_filename: joi_1.default.string().required().allow(""),
    metadata: joi_1.default.object().optional(),
});
exports.addTagsSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    label: joi_1.default.string().required(),
    tags: joi_1.default.array().optional(),
    metadata: joi_1.default.object().optional(),
});
exports.updateTagsSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
    label: joi_1.default.string().required(),
    tags: joi_1.default.array().optional(),
    metadata: joi_1.default.object().optional(),
});
exports.addReportSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    report_name: joi_1.default.string().required(),
    report_type: joi_1.default.string().required(),
    file_type: joi_1.default.string().required(),
    tags: joi_1.default.array().required(),
    tagResults: joi_1.default.object().required(),
    base_template_url: joi_1.default.string().required().allow(""),
    generated_report_url: joi_1.default.string().required().allow(""),
    document_ids: joi_1.default.array().required(),
    report_hidden: joi_1.default.boolean().required(),
    generated_report: joi_1.default.boolean().required(),
    metadata: joi_1.default.object().optional(),
});
exports.updateReportSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    report_id: joi_1.default.string().required(),
    generated_report_url: joi_1.default.string().required(),
    generated_report: joi_1.default.boolean().required(),
});
exports.resetEmbedFlagSchema = joi_1.default.object({
    embed_flag: joi_1.default.boolean().required(),
    document_id: joi_1.default.string().required(),
});
exports.generateDocxSchema = joi_1.default.object({
    tags: joi_1.default.object().required(),
    reportId: joi_1.default.string().required(),
    templateURL: joi_1.default.string().required(),
    outputName: joi_1.default.string().required(),
});
exports.questionSchema = joi_1.default.object({
    question: joi_1.default.string().required(),
    documentIds: joi_1.default.array().optional(),
});
exports.idSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
});
exports.userIdSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
});
exports.getDocsSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    embedded: joi_1.default.any().required(),
});
exports.getReportsSchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
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
    uuid: joi_1.default.string().required(),
    email: joi_1.default.string().optional(),
    first_name: joi_1.default.string().optional(),
    last_name: joi_1.default.string().optional(),
    phone_number: joi_1.default.string().optional(),
    address_line1: joi_1.default.string().optional(),
    address_line2: joi_1.default.string().optional(),
    address_line3: joi_1.default.string().optional(),
    address_line4: joi_1.default.string().optional(),
    role: joi_1.default.string().optional(),
    superUser: joi_1.default.boolean().optional(),
    metadata: joi_1.default.object().optional(),
    company: joi_1.default.string().optional(),
});
exports.updateHistorySchema = joi_1.default.object({
    user_id: joi_1.default.string().required(),
    history: joi_1.default.array().required(),
    metadata: joi_1.default.object().optional(),
});
exports.returnPresignedURLSchema = joi_1.default.object({
    user_id: joi_1.default.string().optional(),
    file: joi_1.default.string().required(),
});
