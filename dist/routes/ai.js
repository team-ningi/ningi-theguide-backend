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
            const answers = await (0, queryPinecone_1.queryPineconeVectorStoreAndQueryLLM)(client, process.env.PINECONE_INDEX_NAME, theQuery, filterQuery);
            return answers;
        };
        //  $4.82 -> AFTER FF ->  ??   (15 in a chunk) -> COSTS ALL TAGS RETURNED
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
        console.log("finsihed poulating tags");
        console.log({ tagResults });
        console.log("amount of tags generated: " + Object.keys(tagResults).length);
        // Update report - insert tag results
        const result = await reports_model_1.reportsModel.findOneAndUpdate({ _id: reportId }, {
            tagResults,
        }, {
            new: true,
            upsert: false,
        });
        // generate document
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
//doc gen
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
/*

{
    Client1Title: 'Mr',
    Client1OtherTitles: '',
    Client1FirstName: 'Antonio',
    Client1MiddleName: 'Gerardo',
    Client1LastName: 'Cervi',
    Client1Salutation: 'Tony',
    Client1MaidenPreviousName: 'Black',
    Client1DOB: '20/01/1972',
    Client1Age: '51',
    Client1Gender: 'Male',
    Client1MaritalStatus: 'Married',
    Client1MarriedSince: '',
    Client1Nationality: 'British',
    Client1NationalInsuranceNum: 'NX720230D',
    Client1CountryOfResidence: 'United Kingdom',
    Client2Title: 'Mrs',
    Client2OtherTitles: '',
    Client2FirstName: 'Aileen',
    Client2MiddleName: '',
    Client2LastName: 'Cervi',
    Client2Salutation: 'Mrs',
    Client2MaidenPreviousName: 'Black',
    Client2DOB: '12/09/1975',
    Client2Age: '47',
    Client2Gender: 'Female',
    Client2MaritalStatus: 'Married',
    Client2MarriedSince: '',
    Client2Nationality: 'British',
    Client2NationalInsuranceNum: 'JC705680A',
    Client2CountryOfResidence: 'United Kingdom',
    Client2CountryOfDomicile: 'United Kingdom',
    Client2Expatriate: 'No',
    Client2CountryOfBirth: 'United Kingdom',
    Client2PlaceOfBirth: 'Broxburn',
    Client2HaveValidWill: 'Yes',
    Client2IsWillUpToDate: 'Yes',
    Client2BeenAdvisedToMakeAWill: 'No',
    Client2PowerOfAttorneyGranted: 'No',
    Client2AttorneyName: '',
    Client2ASmoker: 'No',
    Client2SmokedInLast12Months: 'No',
    Client2InGoodHealth: 'Yes',
    Client2Notes: '',
    Client2MedicalConditions: 'No',
    Client2AnyConsiderationsToBeTaken: 'No',
    Client1AddressLine1: '11 Castell Maynes Crescent',
    Client1AddressLine2: '',
    Client1AddressLine3: '',
    Client1AddressLine4: '',
    Client1City: 'Bonnyrigg',
    Client1Country: 'United Kingdom',
    Client1Postcode: 'EH19 3RU',
    Client1AddressType: 'Home',
    Client1ResidencyStatus: '',
    Client1DateStartedAtAddress: '',
    Client1DateEndedAtAddress: '',
    Client1DefaultAddress: 'Current Address',
    Client1AddressStatus: 'Current Address',
    Client1RegisteredOnElecoralRoll: 'Yes',
    Client1TimeAtAddressInMonths: '',
    Client2AddressLine1: '11 Castell Maynes Crescent',
    Client2AddressLine2: '',
    Client2AddressLine3: '',
    Client2AddressLine4: '',
    Client2City: 'Bonnyrigg',
    Client2Country: 'United Kingdom',
    Client2Postcode: 'EH19 3RU',
    Client2AddressType: 'Home',
    Client2ResidencyStatus: '',
    Client2DateStartedAtAddress: '',
    Client2DateEndedAtAddress: '',
    Client2DefaultAddress: 'Current Address',
    Client2AddressStatus: 'Current Address',
    Client2RegisteredOnElecoralRoll: 'Yes',
    Client2TimeAtAddressInMonths: '',
    Client2Email: 'aileencervi@gmail.com',
    Client2EmailPreferred: 'Yes',
    Client1BankName: '',
    Client1AccountHolder: '',
    Client1BankAddressLine1: '',
    Client1BankAddressLine2: '',
    Client1BankAddressLine3: '',
    Client1BankAddressLine4: '',
    Client1BankAddressCity: '',
    Client1BankAddressCountyStateProvince: '',
    Client1BankAddressCountry: '',
    Client1BankAddressPostCode: '',
    Client1BankAccountNumber: '',
    Client1BankAccountSortCode: '',
    Client1BankDefault: '',
    Client2BankName: '',
    Client2AccountHolder: 'Aileen Cervi',
    Client2BankAddressLine1: '11 Castell Maynes Crescent',
    Client2BankAddressLine2: '',
    Client2BankAddressLine3: '',
    Client2BankAddressLine4: '',
    Client2BankAddressCity: 'Bonnyrigg',
    Client2BankAddressCountyStateProvince: '',
    Client2BankAddressCountry: 'United Kingdom',
    Client2BankAddressPostCode: 'EH19 3RU',
    Client2BankAccountNumber: '',
    Client2BankAccountSortCode: '',
    Client2BankDefault: ''
  }
  */
