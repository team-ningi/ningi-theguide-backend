"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryPineconeVectorStoreAndQueryLLM = void 0;
const openai_1 = require("langchain/embeddings/openai");
const openai_2 = require("langchain/llms/openai");
const chains_1 = require("langchain/chains");
const document_1 = require("langchain/document");
let errors = 0;
let attempts = 0;
let maxTries = 4;
const queryPineconeVectorStoreAndQueryLLM = async (client, indexName, question, filterQuery, type) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = client.Index(indexName);
    const queryEmbedding = await new openai_1.OpenAIEmbeddings().embedQuery(question);
    let queryResponse = await index.query({
        topK: 10,
        vector: queryEmbedding,
        filter: filterQuery,
        includeMetadata: true,
        includeValues: true,
    });
    console.log(`Found ${queryResponse.matches.length} matches...`);
    if (queryResponse.matches.length) {
        const llm = new openai_2.OpenAI({ modelName: "gpt-4" });
        const chain = (0, chains_1.loadQAStuffChain)(llm);
        const concatenatedPageContent = queryResponse.matches
            .map((match) => match?.metadata?.pageContent)
            .join(" ");
        const result = await chain.call({
            input_documents: [new document_1.Document({ pageContent: concatenatedPageContent })],
            question: question,
        });
        console.log(`\n\n Answer: ${result.text}`);
        if (type === "chat") {
            return result.text;
        }
        try {
            return JSON.parse(result.text);
        }
        catch (error) {
            console.error("error on initial parse attempt: ", error);
            errors++;
            while (errors > 0 && attempts < maxTries) {
                try {
                    await new Promise((resolve) => setTimeout(resolve, 600));
                    console.log(`retrying tags attempt :  ${attempts} `);
                    const result = await chain.call({
                        input_documents: [
                            new document_1.Document({ pageContent: concatenatedPageContent }),
                        ],
                        question: question,
                    });
                    const JSONResult = JSON.parse(result.text);
                    attempts = 0;
                    errors = 0;
                    return JSONResult;
                }
                catch (error) {
                    errors++;
                    attempts++;
                    console.error("Error JSON parsing on retry, ", error); // dont return , will break the tagResult object
                }
            }
            if (maxTries >= attempts) {
                attempts = 0;
                errors = 0;
                throw new Error("Failed to generate tags for report after maximum attempts");
            }
        }
    }
    else {
        return "No results found.";
    }
};
exports.queryPineconeVectorStoreAndQueryLLM = queryPineconeVectorStoreAndQueryLLM;
