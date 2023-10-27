import "dotenv/config";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { Pinecone } from "@pinecone-database/pinecone";
import { Errback, Response } from "express";
const fs = require("fs");
const https = require("https");

export default async (
  client: Pinecone,
  indexName: string,
  user_id: string,
  document_url: string,
  document_id: string,
  file_type: string
) => {
  let loader;
  const streamName = `/tmp/${document_id}.${file_type}`;

  const file = fs.createWriteStream(streamName);

  const body = await new Promise((resolve, reject) => {
    https.get(document_url, (response: Response) => {
      var stream = response.pipe(file);
      stream.on("finish", function () {
        fs.readFile(streamName, "utf8", (err: Errback, data: string) => {
          if (err) {
            console.error(err);
            return;
          }
          resolve(data);
        });
      });
    });
  });

  if (file_type === "docx") {
    loader = new DocxLoader(streamName);
  } else if (file_type === "txt") {
    loader = new TextLoader(streamName);
  } else if (file_type === "pdf") {
    loader = new PDFLoader(streamName, {
      splitPages: false,
    });
  } else {
    // unsupported file type
    return false;
  }

  if (body) {
    const docs = await loader.load();
    for (const doc of docs) {
      const index = client.Index(indexName);
      const txtPath = doc.metadata?.source;
      const text = doc.pageContent;

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
      });

      const chunks = await textSplitter.createDocuments([text]);
      // console.log("chunks > ", chunks);
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
      return true;
    }
    return true;
  } else {
    return false;
  }
};
