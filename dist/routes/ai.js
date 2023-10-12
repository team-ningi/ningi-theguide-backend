"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const helper_1 = require("./helper");
// import { idSchema } from "./schemas";
const textloader_1 = __importDefault(require("../ai/textloader"));
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/ai-text", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    const question = req.query.question
        ? String(req.query.question)
        : "where is Gary From";
    const filePath = req.query.fileToUse
        ? String(req.query.fileToUse)
        : "ai/example.txt";
    const result = await (0, textloader_1.default)(question, filePath);
    res.status(200).json({
        question,
        answer: result,
    });
});
exports.default = router;
