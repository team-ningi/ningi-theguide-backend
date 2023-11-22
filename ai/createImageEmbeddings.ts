import "dotenv/config";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { Errback, Response } from "express";
const {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
} = require("@aws-sdk/client-textract");

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

const page = "1";

export default async (
  client: Pinecone,
  indexName: string,
  user_id: string,
  document_url: string,
  document_id: string,
  file_type: string,
  saved_filename: string
) => {
  //* StartDocumentAnalysisCommand
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

  const getDocumentAnalysis = async (jobId: string) => {
    const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId });
    // @ts-ignore
    let words = [];

    while (true) {
      try {
        const data = await textract.send(getCommand);

        console.log("Job Status:", data.JobStatus);

        if (data.JobStatus === "SUCCEEDED") {
          // Process the extracted text results here
          data.Blocks.forEach((block: any) => {
            if (block.BlockType === "WORD") {
              console.log("word : ", block.Text);
              words.push(block.Text);
            }
          });

          if (data.NextToken) {
            // If there is a NextToken, call GetDocumentTextDetectionCommand again with the NextToken
            getCommand.NextToken = data.NextToken;
          } else {
            break; // Exit the loop when all pages have been processed
          }
        } else if (data.JobStatus === "FAILED") {
          console.log("Text extraction failed");
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Check job status every 5 seconds
      } catch (error) {
        console.error(error);
        break;
      }
    }
    // @ts-ignore
    const theResult = words.join(" ");
    console.log("the result ", theResult);

    const index = client.Index(indexName);
    const txtPath = `textract: ${saved_filename}`;
    const text = theResult;

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
    return true;
  };

  return await textract
    .send(startCommand)
    .then(async (data: any) => {
      console.log("Job Id:", data.JobId);
      return await getDocumentAnalysis(data.JobId);
    })
    .catch((error: any) => {
      console.error(error);
    });
  // */

  /* StartDocumentTextDetectionCommand

  const params = {
    DocumentLocation: {
      S3Object: {
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET,
        Name: saved_filename,
      },
    },
  };

  const startCommand = new StartDocumentTextDetectionCommand(params);

  const checkJobStatus = async (jobId: string) => {
    const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
    // @ts-ignore
    let words = [];

    while (true) {
      try {
        const data = await textract.send(getCommand);

        console.log("Job Status:", data.JobStatus);

        if (data.JobStatus === "SUCCEEDED") {
          // Process the extracted text results here
          data.Blocks.forEach((block: any) => {
            if (block.BlockType === "WORD") {
              words.push(block.Text);
            }
          });

          if (data.NextToken) {
            // If there is a NextToken, call GetDocumentTextDetectionCommand again with the NextToken
            getCommand.NextToken = data.NextToken;
          } else {
            break; // Exit the loop when all pages have been processed
          }
        } else if (data.JobStatus === "FAILED") {
          console.log("Text extraction failed");
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Check job status every 5 seconds
      } catch (error) {
        console.error(error);
        break;
      }
    }
    // @ts-ignore
    const theResult = words.join(" ");
    console.log("the result ", theResult);

    const index = client.Index(indexName);
    const txtPath = "image file";
    const text = theResult;

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
    return true;
  };

  return await textract
    .send(startCommand)
    .then(async (data: any) => {
      console.log("Job Id:", data.JobId);
      return await checkJobStatus(data.JobId);
    })
    .catch((error: any) => {
      console.error(error);
    });
  // */
};