"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = require("langchain/llms/openai");
const document_1 = require("langchain/document");
const chains_1 = require("langchain/chains");
const dotenv = require("dotenv");
dotenv.config();
const issueTextArray = [
    "I'm sorry",
    "Im sorry",
    "I dont know",
    "I don't know",
    "provided text is fragmented",
    "unclear and scattered",
    "impossible to decipher",
    "lack necessary context",
    "lacks clarity",
    "I'm afraid",
    "Im afraid",
    "not feasible to rewrite",
    "disjointed information",
];
let errors = 0;
let attempts = 0;
let maxTries = 10;
//step 2
exports.default = async (originalText) => {
    try {
        const llm = new openai_1.OpenAI({ modelName: "gpt-4" });
        const chain = (0, chains_1.loadQAStuffChain)(llm);
        const refinedResult = await chain.call({
            input_documents: [new document_1.Document({ pageContent: originalText })],
            question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.Can any currency or data referencing money be referred to in GBP £, Can all dates be formatted to be presented as 'DD/MM/YYYY', Can the text be returned with line breaks for it to be easier to read back.`,
        });
        console.log("refinedResult:", refinedResult?.text);
        let refinedText = refinedResult?.text;
        issueTextArray.forEach((text) => {
            if (refinedText.includes(text)) {
                errors++;
            }
        });
        while (errors > 0 && attempts < maxTries) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            const refinedResult = await chain.call({
                input_documents: [new document_1.Document({ pageContent: originalText })],
                question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.Can any currency or data referencing money be referred to in GBP £, Can all dates be formatted to be presented as 'DD/MM/YYYY', Can the text be returned with line breaks for it to be easier to read back.`,
            });
            console.log(`refine attempt ${attempts}:  ${refinedResult?.text}`);
            refinedText = refinedResult?.text;
            attempts++;
            errors = 0;
            issueTextArray.forEach((text) => {
                if (refinedText.includes(text)) {
                    errors++;
                }
            });
            if (errors < 1) {
                break;
            }
        }
        attempts = 0;
        errors = 0;
        return {
            originalText,
            refined: refinedText,
        };
    }
    catch (error) {
        console.error("failed to refine text", error);
        return false;
    }
};
