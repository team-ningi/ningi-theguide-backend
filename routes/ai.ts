// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { Pinecone } from "@pinecone-database/pinecone";
import { auditModel } from "./db/audit-model";
import auditCreator from "./db/audit-creator";
import { documentModel } from "./db/document-model";
import { AuthenticateManageToken } from "./helper";
import {
  createIndexSchema,
  createEmbeddingsSchema,
  questionSchema,
} from "./schemas";
import TextLoader from "../ai/textloader";
import AudioLoader from "../ai/audioloader";
import createEmbeddings from "../ai/createEmbeddings";
import createIndex from "../ai/pinecone/createIndex";
import { queryPineconeVectorStoreAndQueryLLM } from "../ai/pinecone/queryPinecone";
import GenerateDocx from "../ai/doc-generation/docx";

const router = Router();

router.get(
  "/v1/aiadviser/in-memory-ai-text",
  nocache(),
  AuthenticateManageToken(),
  async (req: Request, res: Response) => {
    const audio = !!req.query.audio || false;

    const question = req.query.question
      ? String(req.query.question)
      : "where is Gary From";

    const filePath = req.query.fileToUse
      ? String(req.query.fileToUse)
      : "ai/example.txt";

    const result = audio
      ? await AudioLoader(question, filePath, audio)
      : await TextLoader(question, filePath, audio);

    res.status(200).json({
      question,
      answer: result,
    });
  }
);

router.post(
  "/v1/aiadviser/query",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await questionSchema.validateAsync(req.body);
      const { question, documentIds } = req.body;

      const client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT,
      });

      let filterQuery = {};
      if (documentIds?.length) {
        filterQuery = {
          document_id: {
            $in: [...documentIds],
          },
        };
      }

      const result = await queryPineconeVectorStoreAndQueryLLM(
        client,
        process.env.PINECONE_INDEX_NAME,
        question,
        filterQuery
      );

      return res.json({
        question,
        answer: `${result}`,
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to query data",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/create-embeddings",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await createEmbeddingsSchema.validateAsync(req.body);
      const { user_id, document_url, document_id, file_type } = req.body;

      const data = await documentModel
        .find({
          _id: document_id,
          embedding_created: true,
        })
        .lean()
        .exec();

      if (data.length) {
        return res.json({
          error: true,
          msg: "Embedding created already for this document",
        });
      } else {
        const client = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
          environment: process.env.PINECONE_ENVIRONMENT,
        });

        const result = await createEmbeddings(
          client,
          process.env.PINECONE_INDEX_NAME,
          user_id,
          document_url,
          document_id,
          file_type
        );

        if (!result) {
          return res.json({
            error: true,
            msg: "failed to read file",
          });
        }

        await documentModel.findOneAndUpdate(
          { _id: document_id },
          {
            embedding_created: true,
          },
          {
            new: true,
            upsert: false,
          }
        );

        return res.json({
          msg: "Embedding complete",
        });
      }
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to embed data",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/create-index",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await createIndexSchema.validateAsync(req.body);
      const { index_name, vector_dimension } = req.body;

      const client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT,
      });

      await createIndex(client, index_name, vector_dimension);

      return res.json({
        msg: "index created",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to create index",
      });
    }
  }
);

//doc gen
router.post(
  "/v1/aiadviser/docx-generation",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      // await questionSchema.validateAsync(req.body);
      // const { question, documentIds } = req.body;
      const tags = req.body.tags;
      /*
        TODO
        
       1  READ THE TEMPLATE FILE FROM CDN

       2 UPLOAD OUTPUT FILE TO CDN AND UPDATE 'REPORTS' DATABASE 
          /add-report
          body:{
            "user_id":"65281afb4b34e6edd11c1d1b",
            "report_name": "test",
            "report_type": "test",
            "base_template_url": "URL",
            "generated_report_url": "URL",
            "document_ids": [],
            "metadata":{}
          }

      */

      GenerateDocx(tags);

      return res.json({
        msg: "doc generated",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to query data",
      });
    }
  }
);
export default router;
