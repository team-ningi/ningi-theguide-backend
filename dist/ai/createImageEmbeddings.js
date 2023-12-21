"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = require("langchain/embeddings/openai");
const openai_2 = require("langchain/llms/openai");
const document_1 = require("langchain/document");
const chains_1 = require("langchain/chains");
const text_splitter_1 = require("langchain/text_splitter");
const { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand, } = require("@aws-sdk/client-textract");
const fs = require("fs");
const https = require("https");
const dotenv = require("dotenv");
dotenv.config();
const textract = new TextractClient({
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});
// NOT IN USE
// THE ORIGINAL CALL FOR IMAGE->TEXT
// TAKES TOO LONG ON AN ACTUAL SERVER
// so split into 3 calls > extract | refine | embed
exports.default = async (client, indexName, user_id, document_url, document_id, file_type, saved_filename, additionalContext) => {
    const params = {
        DocumentLocation: {
            S3Object: {
                Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET,
                Name: saved_filename,
            },
        },
        FeatureTypes: ["TABLES", "FORMS"],
        ClientRequestToken: `${Date.now()}`,
    };
    const startCommand = new StartDocumentAnalysisCommand(params);
    const getDocumentAnalysis = async (jobId) => {
        const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId });
        // @ts-ignore
        let words = [`${additionalContext} .`];
        while (true) {
            try {
                const data = await textract.send(getCommand);
                console.log("status:", data.JobStatus);
                if (data.JobStatus === "SUCCEEDED") {
                    data.Blocks.forEach((block) => {
                        if (block.BlockType === "WORD") {
                            // console.log("word : ", block.Text);
                            words.push(block.Text);
                        }
                    });
                    if (data.NextToken) {
                        // If there is a NextToken, call GetDocumentTextDetectionCommand again with the NextToken
                        getCommand.NextToken = data.NextToken;
                    }
                    else {
                        break; // Exit the loop when all pages have been processed
                    }
                }
                else if (data.JobStatus === "FAILED") {
                    console.log("Text extraction failed");
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Check job status every x seconds
            }
            catch (error) {
                console.error(error);
                break;
            }
        }
        // @ts-ignore
        const theResult = words.join(" ");
        console.log("the original result ", theResult); // END OF TODO 1
        //call openai
        const llm = new openai_2.OpenAI({ modelName: "gpt-4" });
        const chain = (0, chains_1.loadQAStuffChain)(llm);
        const refinedResult = await chain.call({
            input_documents: [
                //@ts-ignore
                new document_1.Document({ pageContent: theResult }),
            ],
            question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.`,
        });
        console.log("the refined result ", refinedResult); // END OF TODO 2
        // TODO 1
        // RETURN refinedResult to the front end
        // in the middle >
        // show refined text in UI
        // allow user to tweak it
        // send it to the new api route and do TODO2
        // TODO 2
        // FROM HERE BE ITS OWN API CALL
        const index = client.Index(indexName);
        const txtPath = `textract: ${saved_filename}`;
        const text = refinedResult?.text; //theResult;
        const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: 1000,
        });
        const chunks = await textSplitter.createDocuments([text]);
        const embeddingsArrays = await new openai_1.OpenAIEmbeddings().embedDocuments(chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " ")));
        const batchSize = 100;
        let batch = [];
        for (let idx = 0; idx < chunks.length; idx++) {
            const chunk = chunks[idx];
            const vector = {
                id: `${txtPath}_${idx}`,
                values: embeddingsArrays[idx],
                metadata: {
                    ...chunk.metadata,
                    loc: JSON.stringify(chunk.metadata.loc),
                    pageContent: chunk.pageContent,
                    user_id,
                    document_id,
                    txtPath: txtPath,
                },
            };
            batch.push(vector);
            if (batch.length === batchSize || idx === chunks.length - 1) {
                await index.upsert(batch);
                batch = [];
            }
        }
        console.log(`Pinecone index updated with ${chunks.length} vectors`);
        return true;
    };
    return await textract
        .send(startCommand)
        .then(async (data) => {
        console.log("Job Id:", data.JobId);
        return await getDocumentAnalysis(data.JobId);
    })
        .catch((error) => {
        console.error(error);
    });
};
// Alternative method to use AWS textract > StartDocumentTextDetectionCommand
