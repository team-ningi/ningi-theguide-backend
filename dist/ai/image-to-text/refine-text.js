"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = require("langchain/llms/openai");
const document_1 = require("langchain/document");
const chains_1 = require("langchain/chains");
const dotenv = require("dotenv");
dotenv.config();
//step 2
exports.default = async (originalText) => {
    try {
        const llm = new openai_1.OpenAI({ modelName: "gpt-4" });
        const chain = (0, chains_1.loadQAStuffChain)(llm);
        const refinedResult = await chain.call({
            input_documents: [
                //@ts-ignore
                new document_1.Document({ pageContent: originalText }),
            ],
            question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.Can any currency or data referencing money be referred to in GBP £, Can all dates be formatted to be presented as 'DD/MM/YYYY', Can the text be returned with line breaks for it to be easier to read back.`,
        });
        console.log("refinedResult:", refinedResult?.text);
        return {
            originalText,
            refined: refinedResult?.text,
        };
    }
    catch (error) {
        console.error("failed to refine text", error);
        return false;
    }
};
