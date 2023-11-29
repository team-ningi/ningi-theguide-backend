"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const pinecone_1 = require("@pinecone-database/pinecone");
const reports_model_1 = require("./db/reports-model");
const document_model_1 = require("./db/document-model");
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const textloader_1 = __importDefault(require("../ai/textloader"));
const audioloader_1 = __importDefault(require("../ai/audioloader"));
const createEmbeddings_1 = __importDefault(require("../ai/createEmbeddings"));
const createImageEmbeddings_1 = __importDefault(require("../ai/createImageEmbeddings"));
const createIndex_1 = __importDefault(require("../ai/pinecone/createIndex"));
const queryPinecone_1 = require("../ai/pinecone/queryPinecone");
const docx_1 = __importDefault(require("../ai/doc-generation/docx"));
const uuid_1 = require("uuid");
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
        const result = await (0, queryPinecone_1.queryPineconeVectorStoreAndQueryLLM)(client, process.env.PINECONE_INDEX_NAME, question, filterQuery, "chat");
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
router.post("/v1/aiadviser/query-get-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.getTagsSchema.validateAsync(req.body);
        const { tags, documentIds, additionalPrompt, reportId } = req.body;
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
        const prePrompt = "I want to find out some information, everything i wish to know is inside of this Array of objects,the value in each item is a query.";
        const postPrompt = "return the data as an object of key: values, if you dont know an answer for a specific item keep the structure of key:value but make the value be an empty string, if you do know the answer replace the value with the correct data, Keep context, dont return anything you are unsure of. return only the specified JSON object of key: value. Respond ONLY with a Valid JSON message";
        let tagResults = {};
        const chunkArrayInGroups = (arr, size) => {
            let results = [];
            while (arr.length) {
                results.push(arr.splice(0, size));
            }
            return results;
        };
        const processChunk = async (batch) => {
            const batchStrings = batch.map((obj) => JSON.stringify(obj));
            const theQuery = `${additionalPrompt} ${prePrompt} ${batchStrings} ${postPrompt}`;
            // console.log(theQuery);
            const answers = await (0, queryPinecone_1.queryPineconeVectorStoreAndQueryLLM)(client, process.env.PINECONE_INDEX_NAME, theQuery, filterQuery, "tags");
            return answers;
        };
        const processAllChunks = async (batches) => {
            for (const batch of batches) {
                const answers = await processChunk(batch);
                tagResults = { ...tagResults, ...answers };
                await new Promise((resolve) => setTimeout(resolve, 1200));
            }
            console.log("All batches processed!");
        };
        const chunks = chunkArrayInGroups(tags, 15);
        console.log(chunks.length);
        await processAllChunks(chunks);
        if (Object.keys(tagResults).length < tags.length) {
            console.log(` Did not generate all tags, tags expected: ${tags.length} , tags generated : ${Object.keys(tagResults).length} `);
        }
        console.log("Finished Poulating Tags");
        const result = await reports_model_1.reportsModel.findOneAndUpdate({ _id: reportId }, {
            tagResults,
        }, {
            new: true,
            upsert: false,
        });
        const outputName = `${(0, uuid_1.v4)()}.${result?.file_type}`;
        await (0, docx_1.default)(tagResults, reportId, result.base_template_url, outputName);
        return res.json({
            message: "finished tags & prompts & generated the report",
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
router.post("/v1/aiadviser/query-get-tags-single-chunk", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.getTagsSchema.validateAsync(req.body);
        const { tags, documentIds, additionalPrompt, reportId } = req.body;
        const report = await reports_model_1.reportsModel
            .findOne({
            _id: reportId,
        })
            .lean()
            .exec();
        const tagResults = report?.tagResults || {};
        const initialPrompt = report?.initial_prompt || {};
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
        const prePrompt = "I want to find out some information, everything i wish to know is inside of this Array of objects,the value in each item is a query.Keep the answers to each query as simple as possible.";
        const postPrompt = "return the data as a valid JSON object consisting of { 'key': 'value' }, if you dont know an answer for a specific item keep the structure of key:value but make the value be an empty string, if you do know the answer replace the value with the correct data, Keep context, dont return anything you are unsure of. return only the specified JSON object of key: value. Respond ONLY with a Valid JSON object";
        const processChunk = async (batch) => {
            const batchStrings = batch.map((obj) => JSON.stringify(obj));
            const theQuery = `${initialPrompt} ${prePrompt} [${batchStrings}] ${postPrompt}`;
            // console.log(theQuery);
            const answers = await (0, queryPinecone_1.queryPineconeVectorStoreAndQueryLLM)(client, process.env.PINECONE_INDEX_NAME, theQuery, filterQuery, "tags");
            return answers;
        };
        const answers = await processChunk(tags);
        const tagResultsUpdated = { ...tagResults, ...answers };
        console.log("Finished Poulating Tags");
        await reports_model_1.reportsModel.findOneAndUpdate({ _id: reportId }, {
            tagResults: tagResultsUpdated,
        }, {
            new: true,
            upsert: false,
        });
        return res.json({
            message: "finished resolving tags",
        });
    }
    catch (e) {
        return res.json({
            error: true,
            msg: "failed to resolve tags",
        });
    }
});
router.post("/v1/aiadviser/create-embeddings", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.createEmbeddingsSchema.validateAsync(req.body);
        const { user_id, document_url, document_id, file_type, additional_context, type_of_embedding, } = req.body;
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
            let result;
            if (type_of_embedding === "document") {
                result = await (0, createEmbeddings_1.default)(client, process.env.PINECONE_INDEX_NAME, user_id, document_url, document_id, file_type, data[0]?.saved_filename);
            }
            else if (type_of_embedding === "image") {
                result = await (0, createImageEmbeddings_1.default)(client, process.env.PINECONE_INDEX_NAME, user_id, document_url, document_id, file_type, data[0]?.saved_filename, additional_context);
                console.log("textract = ", result);
                // RES RETURN THE TEXT
                // ON THE NEW API CALL DO THE documentModel.findOneAndUpdate(
                // update embedding_created + image_to_text_content= result
            }
            if (!result) {
                return res.json({
                    error: true,
                    msg: "failed to EMBED file",
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
router.post("/v1/aiadviser/docx-generation", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.generateDocxSchema.validateAsync(req.body);
        const { tags, reportId, templateURL, outputName } = req.body;
        await (0, docx_1.default)(tags, reportId, templateURL, outputName);
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
