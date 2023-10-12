"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.emailAddressSchema = exports.emailSchema = exports.idSchema = exports.createContentSchema = exports.updateContentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateContentSchema = joi_1.default.object({
    content_id: joi_1.default.string().required(),
    title: joi_1.default.string().required(),
    image_url: joi_1.default.string().required(),
    content: joi_1.default.string().required(),
});
exports.createContentSchema = joi_1.default.object({
    author: joi_1.default.string().required(),
    user_id: joi_1.default.string().required(),
    title: joi_1.default.string().required(),
    image_url: joi_1.default.string().required(),
    content: joi_1.default.string().required(),
    type: joi_1.default.string().required(),
    metadata: joi_1.default.object().optional(),
});
exports.idSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
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
