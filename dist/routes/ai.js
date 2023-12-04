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
const createIndex_1 = __importDefault(require("../ai/pinecone/createIndex"));
const queryPinecone_1 = require("../ai/pinecone/queryPinecone");
const docx_1 = __importDefault(require("../ai/doc-generation/docx"));
const uuid_1 = require("uuid");
const extract_text_1 = __importDefault(require("../ai/image-to-text/extract-text"));
const refine_text_1 = __importDefault(require("../ai/image-to-text/refine-text"));
const embed_text_1 = __importDefault(require("../ai/image-to-text/embed-text"));
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
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    const heartbeatInterval = setInterval(() => {
        res.write(" ");
        res.flush();
        console.log("processing...");
    }, 10000);
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
        clearInterval(heartbeatInterval);
        return res.end(JSON.stringify({
            question,
            answer: `${result}`,
        }));
    }
    catch (e) {
        console.log(e);
        clearInterval(heartbeatInterval);
        return res.end(JSON.stringify({
            error: true,
            msg: "failed to query data",
        }));
    }
});
router.post("/v1/aiadviser/query-get-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    // THIS IS NOT IN USE ... IN FAVOR OF /query-get-tags-single-chunk
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
        const prePrompt = "I want to find out some information, everything i wish to know is inside of this Array of objects,the value in each item is an individial query.";
        const postPrompt = "return the data as an object of { key: values}, if you dont know an answer for any individual item, please keep the structure of {key:value} but return the value be an empty string, if you do know the answer replace the value with the correct data, Keep context, dont return anything you are unsure of. return only the specified JSON object of {key: value}. Respond ONLY with a Valid JSON message, do not respond with text such as I Dont Know. JSON object only please with all of the keys present. If you do not have the answer for a paticular query return '' if you do know the answer put this in the place of value. If the provided text does not contain the information required to answer a query, then simply return '' as the answer";
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
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    const heartbeatInterval = setInterval(() => {
        res.write(" ");
        res.flush();
        console.log("processing...");
    }, 10000);
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
        clearInterval(heartbeatInterval);
        return res.end(JSON.stringify({
            message: "finished resolving tags",
        }));
    }
    catch (e) {
        clearInterval(heartbeatInterval);
        return res.end(JSON.stringify({
            error: true,
            msg: "failed to resolve tags",
        }));
    }
});
router.post("/v1/aiadviser/create-embeddings", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    const heartbeatInterval = setInterval(() => {
        res.write(" ");
        res.flush();
        console.log("processing...");
    }, 10000);
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
            clearInterval(heartbeatInterval);
            return res.end(JSON.stringify({
                error: true,
                msg: "Embedding created already for this document",
            }));
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
                if (!result) {
                    clearInterval(heartbeatInterval);
                    return res.end(JSON.stringify({
                        error: true,
                        msg: "failed to EMBED file",
                    }));
                }
            }
            else if (type_of_embedding === "image") {
                result = await (0, extract_text_1.default)(data[0]?.saved_filename, additional_context);
                console.log("textract = ", result);
                if (result) {
                    clearInterval(heartbeatInterval);
                    return res.end(JSON.stringify({
                        result,
                    }));
                }
                else {
                    clearInterval(heartbeatInterval);
                    return res.end(JSON.stringify({
                        error: true,
                        msg: "failed to EMBED file",
                    }));
                }
            }
            await document_model_1.documentModel.findOneAndUpdate({ _id: document_id }, {
                embedding_created: true,
            }, {
                new: true,
                upsert: false,
            });
            clearInterval(heartbeatInterval);
            return res.end(JSON.stringify({
                msg: "Embedding complete",
            }));
        }
    }
    catch (e) {
        console.log(e);
        clearInterval(heartbeatInterval);
        return res.end(JSON.stringify({
            error: true,
            msg: "failed to embed data",
        }));
    }
});
router.post("/v1/aiadviser/refine-text", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    const heartbeatInterval = setInterval(() => {
        res.write(" ");
        res.flush();
        console.log("processing...");
    }, 10000);
    try {
        await schemas_1.refineTextSchema.validateAsync(req.body);
        const { original_text, document_id } = req.body;
        const results = await (0, refine_text_1.default)(original_text);
        const { originalText, refined } = results;
        await document_model_1.documentModel.findOneAndUpdate({ _id: document_id }, {
            image_to_text_content: refined,
            image_to_text_content_original: originalText,
        }, {
            new: true,
            upsert: false,
        });
        clearInterval(heartbeatInterval);
        res.end("successfully refined and stored text");
    }
    catch (e) {
        console.log(e);
        clearInterval(heartbeatInterval);
        return res.end(JSON.stringify({
            error: true,
            msg: "failed to refine the text",
        }));
    }
});
router.post("/v1/aiadviser/embed-refined-text", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.embedRefinedTextSchema.validateAsync(req.body);
        const { user_id, document_id, textToEmbed } = req.body;
        const data = await document_model_1.documentModel
            .find({
            _id: document_id,
        })
            .lean()
            .exec();
        if (!data.length) {
            return res.json({
                error: true,
                msg: "invalid Doc Id",
            });
        }
        const saved_filename = data[0]?.saved_filename;
        const client = new pinecone_1.Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        await (0, embed_text_1.default)(client, process.env.PINECONE_INDEX_NAME, user_id, document_id, saved_filename, textToEmbed);
        return res.json({
            msg: "Embedding complete",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to refine the text",
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
router.post("/v1/aiadviser/testing-timeouts", (0, nocache_1.default)(), async (req, res) => {
    function someLongRunningProcess() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("Process completed.🚀");
            }, 90000);
        });
    }
    console.log("**>>> starting test long running function");
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    const heartbeatInterval = setInterval(() => {
        res.write(" ");
        res.flush();
        console.log("heart beat");
    }, 10000);
    // Your long-running process here
    try {
        await someLongRunningProcess();
        clearInterval(heartbeatInterval);
        res.end("result");
    }
    catch (e) {
        clearInterval(heartbeatInterval);
        res.status(500).end(e.message);
    }
});
exports.default = router;
