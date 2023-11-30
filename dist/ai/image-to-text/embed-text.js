"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = require("langchain/embeddings/openai");
const text_splitter_1 = require("langchain/text_splitter");
const document_model_1 = require("../../routes/db/document-model");
const dotenv = require("dotenv");
dotenv.config();
//step 3
exports.default = async (client, indexName, user_id, document_id, saved_filename, textToEmbed) => {
    try {
        const index = client.Index(indexName);
        const txtPath = `textract: ${saved_filename}`;
        const text = textToEmbed;
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
        await document_model_1.documentModel.findOneAndUpdate({ _id: document_id }, {
            embedding_created: true,
            image_to_text_content: textToEmbed,
        }, {
            new: true,
            upsert: false,
        });
        return true;
    }
    catch (e) {
        console.log("failed to embed refined text ", e);
        return false;
    }
};
