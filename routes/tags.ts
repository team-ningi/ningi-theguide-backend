// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { tagsModel } from "./db/tags-model";
import tagsCreator from "./db/tags-creator";
import { AuthenticateManageToken } from "./helper";
import {
  idSchema,
  userIdSchema,
  addTagsSchema,
  updateTagsSchema,
} from "./schemas";

const router = Router();

router.get(
  "/v1/aiadviser/get-all-tags",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);

      const result = await tagsModel
        .find()
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
        msg: "we were unable to GET tags",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-tags-by-userid",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await userIdSchema.validateAsync(req.body);
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const { user_id } = req.body;

      const result = await tagsModel
        .find({ user_id })
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
        msg: "we were unable to GET the users tags",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-individual-tags",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await tagsModel
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
        msg: "we were unable to GET individual tags",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/add-tags",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await addTagsSchema.validateAsync(req.body);

      const newContent = {
        user_id: req.body.user_id,
        label: req.body.label,
        tags: req.body.tags,
        metadata: req.body.metadata || {},
      };
      const tags = await tagsCreator(newContent);

      return res.json({
        error: false,
        tags,
        msg: "tags data added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert tags",
      });
    }
  }
);
router.put(
  "/v1/aiadviser/update-tags",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateTagsSchema.validateAsync(req.body);

      const { id, label, first_name, tags, metadata } = req.body;

      const result = await usersModel.findOneAndUpdate(
        { _id: id },
        {
          label,
          first_name,
          tags,
          metadata: metadata,
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
        msg: "failed to insert tags",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/delete-tags",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await tagsModel.findOneAndRemove({
        _id: id,
      });
      result
        ? res.json({ msg: `tags ${id} has been deleted` })
        : res.json({ msg: `tags ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

export default router;
