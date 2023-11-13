"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const pinecone_1 = require("@pinecone-database/pinecone");
const document_model_1 = require("./db/document-model");
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const textloader_1 = __importDefault(require("../ai/textloader"));
const audioloader_1 = __importDefault(require("../ai/audioloader"));
const createEmbeddings_1 = __importDefault(require("../ai/createEmbeddings"));
const createIndex_1 = __importDefault(require("../ai/pinecone/createIndex"));
const queryPinecone_1 = require("../ai/pinecone/queryPinecone");
const docx_1 = __importDefault(require("../ai/doc-generation/docx"));
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/in-memory-ai-text", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    const audio = !!req.query.audio || false;
    const question = req.query.question
        ? String(req.query.question)
        : "where is Gary From";
    const filePath = req.query.fileToUse
        ? String(req.query.fileToUse)
        : "ai/example.txt";
    const result = audio
        ? await (0, audioloader_1.default)(question, filePath, audio)
        : await (0, textloader_1.default)(question, filePath, audio);
    res.status(200).json({
        question,
        answer: result,
    });
});
router.post("/v1/aiadviser/query", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.questionSchema.validateAsync(req.body);
        const { question, documentIds } = req.body;
        const client = new pinecone_1.Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        let filterQuery = {};
        if (documentIds?.length) {
            filterQuery = {
                document_id: {
                    $in: [...documentIds],
                },
            };
        }
        const result = await (0, queryPinecone_1.queryPineconeVectorStoreAndQueryLLM)(client, process.env.PINECONE_INDEX_NAME, question, filterQuery);
        const auditData = {
            action: "query documents",
            metadata: {
                question,
                answer: `${result}`,
                documentIds,
            },
        };
        await (0, helper_1.addToAudit)(req, auditData);
        return res.json({
            question,
            answer: `${result}`,
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to query data",
        });
    }
});
router.post("/v1/aiadviser/create-embeddings", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.createEmbeddingsSchema.validateAsync(req.body);
        const { user_id, document_url, document_id, file_type } = req.body;
        const data = await document_model_1.documentModel
            .find({
            _id: document_id,
            embedding_created: true,
        })
            .lean()
            .exec();
        if (data.length) {
            return res.json({
                error: true,
                msg: "Embedding created already for this document",
            });
        }
        else {
            const client = new pinecone_1.Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
                environment: process.env.PINECONE_ENVIRONMENT,
            });
            const data = await document_model_1.documentModel
                .find({
                _id: document_id,
            })
                .lean()
                .exec();
            const result = await (0, createEmbeddings_1.default)(client, process.env.PINECONE_INDEX_NAME, user_id, document_url, document_id, file_type, data[0]?.saved_filename);
            if (!result) {
                return res.json({
                    error: true,
                    msg: "failed to read file",
                });
            }
            await document_model_1.documentModel.findOneAndUpdate({ _id: document_id }, {
                embedding_created: true,
            }, {
                new: true,
                upsert: false,
            });
            return res.json({
                msg: "Embedding complete",
            });
        }
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to embed data",
        });
    }
});
router.post("/v1/aiadviser/create-index", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.createIndexSchema.validateAsync(req.body);
        const { index_name, vector_dimension } = req.body;
        const client = new pinecone_1.Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        await (0, createIndex_1.default)(client, index_name, vector_dimension);
        return res.json({
            msg: "index created",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to create index",
        });
    }
});
//doc gen
router.post("/v1/aiadviser/docx-generation", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        // await questionSchema.validateAsync(req.body);
        // const { question, documentIds } = req.body;
        const tags = req.body.tags;
        /*
          TODO
          
         PASS THIS IN:
            REPORT ID
            TEMPLATE URL                > templateToUse
            FILENAME TO SAVE REPORT AS  > reportOutputName
  
        */
        (0, docx_1.default)(tags);
        return res.json({
            msg: "doc generated",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to query data",
        });
    }
});
exports.default = router;
