// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { documentModel } from "./db/document-model";
import documentCreator from "./db/document-creator";
import { AuthenticateManageToken } from "./helper";
import {
  idSchema,
  getDocsSchema,
  resetEmbedFlagSchema,
  addDocumentSchema,
  searchDocsSchema,
  returnPresignedURLSchema,
} from "./schemas";
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});
console.log("can read env ", process.env.NEXT_PUBLIC_AWS_KEY_REGION);
const getPresignedUrl = async (filePath: string) =>
  getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET,
      Key: filePath,
    }),
    { expiresIn: 6000 }
  );

const router = Router();

router.get(
  "/v1/aiadviser/get-all-documents",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const searchType = req.query.type ? { type: req.query.type } : {};

      const result = await documentModel
        .find(searchType)
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ $natural: -1 })
        .exec();

      res.json([...result]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to GET documents",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/search-documents",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await searchDocsSchema.validateAsync(req.body);
      const skip = !req.body.skip ? 0 : parseInt(req.body.skip, 10);
      const limit = !req.body.limit ? 100 : parseInt(req.body.limit, 10);
      const { file_type, embedded, search } = req.body;
      const searchEmbedded =
        embedded !== "all" ? { embedding_created: embedded } : {}; // "all" | true | false

      let searchQuery = { ...searchEmbedded };
      console.log({ searchQuery });
      if (file_type) {
        searchQuery = { ...searchQuery, file_type };
      }
      /*
        example with all options
        {
            "file_type":"txt"
            "embedded": true,
            "search":"van",
            "limit":1,
            "skip":0
        }
      */
      let result;
      if (search) {
        result = await documentModel
          .aggregate([
            {
              $match: {
                $and: [
                  {
                    label: {
                      $regex: ".*" + search + ".*",
                      $options: "i",
                    },
                  },
                  { ...searchQuery },
                ],
              },
            },
          ])
          .skip(skip)
          .limit(limit);
      } else {
        result = await documentModel
          .find({ ...searchQuery })
          .lean()
          .skip(skip)
          .limit(limit)
          .sort({ $natural: -1 })
          .exec();
      }

      result ? res.json(result) : res.json([]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to search the documents",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-documents-by-userid",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await getDocsSchema.validateAsync(req.body);
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const { user_id, embedded } = req.body;
      const searchEmbedded =
        embedded !== "all" ? { embedding_created: embedded } : {}; // "all" | true | false

      const result = await documentModel
        .find({ user_id, ...searchEmbedded })
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ $natural: -1 })
        .exec();

      result ? res.json(result) : res.json([]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to GET the users documents",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-individual-document",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await documentModel
        .findOne({
          _id: id,
        })
        .lean()
        .exec();

      result ? res.json([result]) : res.json([]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to GET individual document",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/set-embedding-flag",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await resetEmbedFlagSchema.validateAsync(req.body);

      const { embed_flag, document_id } = req.body;

      const data = await documentModel
        .find({
          _id: document_id,
        })
        .lean()
        .exec();

      if (!data) {
        return res.json({
          error: true,
          msg: "No document found for the id",
        });
      }

      const result = await documentModel.findByIdAndUpdate(
        { _id: data[0]?._id },
        {
          embedding_created: embed_flag,
        },
        {
          new: true,
          upsert: false,
        }
      );
      res.json(result);
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to update embed flag",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/add-document",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await addDocumentSchema.validateAsync(req.body);

      const newContent = {
        user_id: req.body.user_id,
        label: req.body.label,
        file_url: req.body.file_url,
        file_type: req.body.file_type,
        original_filename: req.body.original_filename,
        saved_filename: req.body.saved_filename,
        custom_filename: req.body.custom_filename,
        metadata: req.body.metadata || {},
      };
      const document = await documentCreator(newContent);

      return res.json({
        error: false,
        document,
        msg: "document data added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert document data",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/delete-document",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await documentModel.findOneAndRemove({
        _id: id,
      });
      result
        ? res.json({ msg: `Document ${id} has been deleted` })
        : res.json({ msg: `Document ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

router.post(
  "/v1/aiadviser/return-presigned-url",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await returnPresignedURLSchema.validateAsync(req.body);
      const { file } = req.body;

      const signedURL = await getPresignedUrl(file);
      // console.log(signedURL);
      return res.json({
        signedURL,
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to return URL",
      });
    }
  }
);

export default router;
