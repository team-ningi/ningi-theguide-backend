"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryPineconeVectorStoreAndQueryLLM = void 0;
const openai_1 = require("langchain/embeddings/openai");
const openai_2 = require("langchain/llms/openai");
const chains_1 = require("langchain/chains");
const document_1 = require("langchain/document");
const queryPineconeVectorStoreAndQueryLLM = async (client, indexName, question, filterQuery) => {
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
        const llm = new openai_2.OpenAI({});
        const chain = (0, chains_1.loadQAStuffChain)(llm);
        const concatenatedPageContent = queryResponse.matches
            .map((match) => match?.metadata?.pageContent)
            .join(" ");
        const result = await chain.call({
            input_documents: [new document_1.Document({ pageContent: concatenatedPageContent })],
            question: question,
        });
        console.log(`\n\n Answer: ${result.text}`);
        try {
            return JSON.parse(result.text);
        }
        catch (error) {
            console.error("Error JSON parsing, ", error);
            // return result.text;
            return {};
        }
    }
    else {
        return "No results found.";
    }
};
exports.queryPineconeVectorStoreAndQueryLLM = queryPineconeVectorStoreAndQueryLLM;
