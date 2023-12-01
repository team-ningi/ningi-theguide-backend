// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { Pinecone } from "@pinecone-database/pinecone";
import { auditModel } from "./db/audit-model";
import auditCreator from "./db/audit-creator";
import { reportsModel } from "./db/reports-model";
import { documentModel } from "./db/document-model";
import { AuthenticateManageToken, addToAudit } from "./helper";
import {
  createIndexSchema,
  createEmbeddingsSchema,
  refineTextSchema,
  embedRefinedTextSchema,
  questionSchema,
  generateDocxSchema,
  getTagsSchema,
} from "./schemas";
import TextLoader from "../ai/textloader";
import AudioLoader from "../ai/audioloader";
import createEmbeddings from "../ai/createEmbeddings";
import createImageEmbeddings from "../ai/createImageEmbeddings";
import createIndex from "../ai/pinecone/createIndex";
import { queryPineconeVectorStoreAndQueryLLM } from "../ai/pinecone/queryPinecone";
import GenerateDocx from "../ai/doc-generation/docx";
import { v4 as uuidv4 } from "uuid";
import extractText from "../ai/image-to-text/extract-text";
import refineText from "../ai/image-to-text/refine-text";
import embedText from "../ai/image-to-text/embed-text";

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
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const heartbeatInterval = setInterval(() => {
      res.write(" ");
      res.flush();
      console.log("processing...");
    }, 10000);
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
        filterQuery,
        "chat"
      );

      const auditData = {
        action: "query documents",
        metadata: {
          question,
          answer: `${result}`,
          documentIds,
        },
      };
      await addToAudit(req, auditData);

      clearInterval(heartbeatInterval);
      return res.end(
        JSON.stringify({
          question,
          answer: `${result}`,
        })
      );
    } catch (e) {
      console.log(e);
      clearInterval(heartbeatInterval);
      return res.end(
        JSON.stringify({
          error: true,
          msg: "failed to query data",
        })
      );
    }
  }
);

router.post(
  "/v1/aiadviser/query-get-tags",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    // THIS IS NOT IN USE ... IN FAVOR OF /query-get-tags-single-chunk
    try {
      await getTagsSchema.validateAsync(req.body);
      const { tags, documentIds, additionalPrompt, reportId } = req.body;

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

      const prePrompt =
        "I want to find out some information, everything i wish to know is inside of this Array of objects,the value in each item is a query.";
      const postPrompt =
        "return the data as an object of key: values, if you dont know an answer for a specific item keep the structure of key:value but make the value be an empty string, if you do know the answer replace the value with the correct data, Keep context, dont return anything you are unsure of. return only the specified JSON object of key: value. Respond ONLY with a Valid JSON message";
      let tagResults = {};

      const chunkArrayInGroups = (arr, size) => {
        let results = [];
        while (arr.length) {
          results.push(arr.splice(0, size));
        }
        return results;
      };

      const processChunk = async (batch) => {
        const batchStrings = batch.map((obj) => JSON.stringify(obj));
        const theQuery = `${additionalPrompt} ${prePrompt} ${batchStrings} ${postPrompt}`;
        // console.log(theQuery);
        const answers = await queryPineconeVectorStoreAndQueryLLM(
          client,
          process.env.PINECONE_INDEX_NAME,
          theQuery,
          filterQuery,
          "tags"
        );

        return answers;
      };

      const processAllChunks = async (batches) => {
        for (const batch of batches) {
          const answers = await processChunk(batch);
          tagResults = { ...tagResults, ...answers };
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
        console.log("All batches processed!");
      };

      const chunks = chunkArrayInGroups(tags, 15);
      console.log(chunks.length);

      await processAllChunks(chunks);

      if (Object.keys(tagResults).length < tags.length) {
        console.log(
          ` Did not generate all tags, tags expected: ${
            tags.length
          } , tags generated : ${Object.keys(tagResults).length} `
        );
      }

      console.log("Finished Poulating Tags");
      const result = await reportsModel.findOneAndUpdate(
        { _id: reportId },
        {
          tagResults,
        },
        {
          new: true,
          upsert: false,
        }
      );

      const outputName = `${uuidv4()}.${result?.file_type}`;
      await GenerateDocx(
        tagResults,
        reportId,
        result.base_template_url,
        outputName
      );

      return res.json({
        message: "finished tags & prompts & generated the report",
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
  "/v1/aiadviser/query-get-tags-single-chunk",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const heartbeatInterval = setInterval(() => {
      res.write(" ");
      res.flush();
      console.log("processing...");
    }, 10000);

    try {
      await getTagsSchema.validateAsync(req.body);
      const { tags, documentIds, additionalPrompt, reportId } = req.body;

      const report = await reportsModel
        .findOne({
          _id: reportId,
        })
        .lean()
        .exec();

      const tagResults = report?.tagResults || {};
      const initialPrompt = report?.initial_prompt || {};

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

      const prePrompt =
        "I want to find out some information, everything i wish to know is inside of this Array of objects,the value in each item is a query.Keep the answers to each query as simple as possible.";
      const postPrompt =
        "return the data as a valid JSON object consisting of { 'key': 'value' }, if you dont know an answer for a specific item keep the structure of key:value but make the value be an empty string, if you do know the answer replace the value with the correct data, Keep context, dont return anything you are unsure of. return only the specified JSON object of key: value. Respond ONLY with a Valid JSON object";

      const processChunk = async (batch) => {
        const batchStrings = batch.map((obj) => JSON.stringify(obj));
        const theQuery = `${initialPrompt} ${prePrompt} [${batchStrings}] ${postPrompt}`;
        // console.log(theQuery);

        const answers = await queryPineconeVectorStoreAndQueryLLM(
          client,
          process.env.PINECONE_INDEX_NAME,
          theQuery,
          filterQuery,
          "tags"
        );
        return answers;
      };

      const answers = await processChunk(tags);
      const tagResultsUpdated = { ...tagResults, ...answers };
      console.log("Finished Poulating Tags");

      await reportsModel.findOneAndUpdate(
        { _id: reportId },
        {
          tagResults: tagResultsUpdated,
        },
        {
          new: true,
          upsert: false,
        }
      );

      clearInterval(heartbeatInterval);
      return res.end(
        JSON.stringify({
          message: "finished resolving tags",
        })
      );
    } catch (e) {
      clearInterval(heartbeatInterval);
      return res.end(
        JSON.stringify({
          error: true,
          msg: "failed to resolve tags",
        })
      );
    }
  }
);

router.post(
  "/v1/aiadviser/create-embeddings",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const heartbeatInterval = setInterval(() => {
      res.write(" ");
      res.flush();
      console.log("processing...");
    }, 10000);

    try {
      await createEmbeddingsSchema.validateAsync(req.body);
      const {
        user_id,
        document_url,
        document_id,
        file_type,
        additional_context,
        type_of_embedding,
      } = req.body;

      const data = await documentModel
        .find({
          _id: document_id,
          embedding_created: true,
        })
        .lean()
        .exec();

      if (data.length) {
        clearInterval(heartbeatInterval);
        return res.end(
          JSON.stringify({
            error: true,
            msg: "Embedding created already for this document",
          })
        );
      } else {
        const client = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
          environment: process.env.PINECONE_ENVIRONMENT,
        });

        const data = await documentModel
          .find({
            _id: document_id,
          })
          .lean()
          .exec();

        let result;

        if (type_of_embedding === "document") {
          result = await createEmbeddings(
            client,
            process.env.PINECONE_INDEX_NAME,
            user_id,
            document_url,
            document_id,
            file_type,
            data[0]?.saved_filename
          );

          if (!result) {
            clearInterval(heartbeatInterval);
            return res.end(
              JSON.stringify({
                error: true,
                msg: "failed to EMBED file",
              })
            );
          }
        } else if (type_of_embedding === "image") {
          result = await extractText(
            data[0]?.saved_filename,
            additional_context
          );
          console.log("textract = ", result);

          if (result) {
            clearInterval(heartbeatInterval);
            return res.end(
              JSON.stringify({
                result,
              })
            );
          } else {
            clearInterval(heartbeatInterval);
            return res.end(
              JSON.stringify({
                error: true,
                msg: "failed to EMBED file",
              })
            );
          }
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

        clearInterval(heartbeatInterval);
        return res.end(
          JSON.stringify({
            msg: "Embedding complete",
          })
        );
      }
    } catch (e) {
      console.log(e);
      clearInterval(heartbeatInterval);
      return res.end(
        JSON.stringify({
          error: true,
          msg: "failed to embed data",
        })
      );
    }
  }
);

router.post(
  "/v1/aiadviser/refine-text",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const heartbeatInterval = setInterval(() => {
      res.write(" ");
      res.flush();
      console.log("processing...");
    }, 10000);

    try {
      await refineTextSchema.validateAsync(req.body);
      const { original_text, document_id } = req.body;

      const results = await refineText(original_text);
      const { originalText, refined } = results;

      await documentModel.findOneAndUpdate(
        { _id: document_id },
        {
          image_to_text_content: refined,
          image_to_text_content_original: originalText,
        },
        {
          new: true,
          upsert: false,
        }
      );

      clearInterval(heartbeatInterval);
      res.end("successfully refined and stored text");
    } catch (e) {
      console.log(e);
      clearInterval(heartbeatInterval);
      return res.end(
        JSON.stringify({
          error: true,
          msg: "failed to refine the text",
        })
      );
    }
  }
);

router.post(
  "/v1/aiadviser/embed-refined-text",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await embedRefinedTextSchema.validateAsync(req.body);
      const { user_id, document_id, textToEmbed } = req.body;

      const data = await documentModel
        .find({
          _id: document_id,
        })
        .lean()
        .exec();

      if (!data.length) {
        return res.json({
          error: true,
          msg: "invalid Doc Id",
        });
      }

      const saved_filename = data[0]?.saved_filename;

      const client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT,
      });

      await embedText(
        client,
        process.env.PINECONE_INDEX_NAME,
        user_id,
        document_id,
        saved_filename,
        textToEmbed
      );

      return res.json({
        msg: "Embedding complete",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to refine the text",
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

router.post(
  "/v1/aiadviser/docx-generation",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await generateDocxSchema.validateAsync(req.body);
      const { tags, reportId, templateURL, outputName } = req.body;
      await GenerateDocx(tags, reportId, templateURL, outputName);

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

router.post("/v1/aiadviser/testing-timeouts", nocache(), async (req, res) => {
  function someLongRunningProcess() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve("Process completed.🚀");
      }, 90000);
    });
  }

  console.log("**>>> starting test long running function");
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const heartbeatInterval = setInterval(() => {
    res.write(" ");
    res.flush();
    console.log("heart beat");
  }, 10000);

  // Your long-running process here
  try {
    await someLongRunningProcess();
    clearInterval(heartbeatInterval);
    res.end("result");
  } catch (e) {
    clearInterval(heartbeatInterval);
    res.status(500).end(e.message);
  }
});
export default router;
