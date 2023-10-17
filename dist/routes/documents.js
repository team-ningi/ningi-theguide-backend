"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const document_model_1 = require("./db/document-model");
const document_creator_1 = __importDefault(require("./db/document-creator"));
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/get-documents", (0, nocache_1.default)(), async (req, res) => {
    try {
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const searchType = req.query.type ? { type: req.query.type } : {};
        const result = await document_model_1.documentModel
            .find(searchType)
            .lean()
            .skip(skip)
            .limit(limit)
            .sort({ $natural: -1 })
            .exec();
        res.json([...result]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET documents",
        });
    }
});
router.post("/v1/aiadviser/get-individual-document", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await document_model_1.documentModel
            .findOne({
            _id: id,
        })
            .lean()
            .exec();
        result ? res.json([result]) : res.json([]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET individual document",
        });
    }
});
router.put("/v1/aiadviser/set-embedding-flag", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.resetEmbedFlagSchema.validateAsync(req.body);
        const { embed_flag, document_id } = req.body;
        const data = await document_model_1.documentModel
            .find({
            _id: document_id,
        })
            .lean()
            .exec();
        if (!data) {
            return res.json({
                error: true,
                msg: "No document found for the id",
            });
        }
        const result = await document_model_1.documentModel.findByIdAndUpdate({ _id: data[0]?._id }, {
            emedding_created: embed_flag,
        }, {
            new: true,
            upsert: false,
        });
        res.json(result);
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to update embed flag",
        });
    }
});
router.post("/v1/aiadviser/add-document", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.addDocumentSchema.validateAsync(req.body);
        const newContent = {
            user_id: req.body.user_id,
            label: req.body.label,
            file_url: req.body.file_url,
            file_type: req.body.file_type,
            original_filename: req.body.original_filename,
            saved_filename: req.body.saved_filename,
            custom_filename: req.body.custom_filename,
            metadata: req.body.metadata || {},
        };
        await (0, document_creator_1.default)(newContent);
        return res.json({
            msg: "document data added",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert document data",
        });
    }
});
exports.default = router;
