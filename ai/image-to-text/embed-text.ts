import "dotenv/config";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone"; //@ts-ignore
import { documentModel } from "../../routes/db/document-model";

const dotenv = require("dotenv");
dotenv.config();

//step 3
export default async (
  client: Pinecone,
  indexName: string,
  user_id: string,
  document_id: string,
  saved_filename: string,
  textToEmbed: string
) => {
  try {
    const index = client.Index(indexName);
    const txtPath = `textract: ${saved_filename}`;
    const text = textToEmbed;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });

    const chunks = await textSplitter.createDocuments([text]);
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );

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

    await documentModel.findOneAndUpdate(
      { _id: document_id },
      {
        embedding_created: true,
        image_to_text_content: textToEmbed,
      },
      {
        new: true,
        upsert: false,
      }
    );

    return true;
  } catch (e) {
    console.log("failed to embed refined text ", e);
    return false;
  }
};
