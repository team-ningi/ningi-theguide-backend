// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { documentModel } from "./db/document-model";
import documentCreator from "./db/document-creator";
import { AuthenticateManageToken } from "./helper";
import { idSchema, updateContentSchema, createContentSchema } from "./schemas";

const router = Router();

router.get("/v1/aiadviser/get-documents", nocache(), async (req, res) => {
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
});

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
  "/v1/aiadviser/update-document",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateContentSchema.validateAsync(req.body);

      const { content_id, title, image_url, content } = req.body;

      const data = await documentModel
        .find({
          _id: content_id,
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
        { _id: content_id },
        {
          title,
          image_url,
          content,
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
        msg: "failed to update content",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/create-content",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await createContentSchema.validateAsync(req.body);

      const newContent = {
        author: req.body.author,
        user_id: req.body.user_id,
        title: req.body.title,
        image_url: req.body.image_url,
        content: req.body.content,
        type: req.body.type,
        metadata: req.body.metadata || {},
      };
      await documentCreator(newContent);

      return res.json({
        msg: "content added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert content",
      });
    }
  }
);

export default router;
