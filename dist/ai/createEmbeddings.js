"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = require("langchain/embeddings/openai");
const text_splitter_1 = require("langchain/text_splitter");
const text_1 = require("langchain/document_loaders/fs/text");
const pdf_1 = require("langchain/document_loaders/fs/pdf");
const fs = require("fs");
const https = require("https");
exports.default = async (client, indexName, user_id, document_url, document_id, file_type) => {
    let loader;
    const streamName = `/tmp/${document_id}.${file_type}`;
    const file = fs.createWriteStream(streamName);
    const body = await new Promise((resolve, reject) => {
        https.get(document_url, (response) => {
            var stream = response.pipe(file);
            stream.on("finish", function () {
                fs.readFile(streamName, "utf8", (err, data) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    resolve(data);
                });
            });
        });
    });
    //
    if (file_type === "txt") {
        loader = new text_1.TextLoader(streamName);
    }
    else if (file_type === "pdf") {
        loader = new pdf_1.PDFLoader(streamName, {
            splitPages: false,
        });
    }
    else {
        // unsupported file type
        return false;
    }
    if (body) {
        const docs = await loader.load();
        for (const doc of docs) {
            const index = client.Index(indexName);
            const txtPath = doc.metadata?.source;
            const text = doc.pageContent;
            const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                chunkSize: 1000,
            });
            const chunks = await textSplitter.createDocuments([text]);
            // console.log("chunks > ", chunks);
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
        }
        return true;
    }
    else {
        return false;
    }
};
