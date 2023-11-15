// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { templateModel } from "./db/template-model";
import templateCreator from "./db/template-creator";
import { AuthenticateManageToken } from "./helper";
import {
  idSchema,
  userIdSchema,
  addTemplateSchema,
  searchTemplatesSchema,
} from "./schemas";

const router = Router();

router.get(
  "/v1/aiadviser/get-all-templates",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);

      const result = await templateModel
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
        msg: "we were unable to GET templates",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/search-templates",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await searchTemplatesSchema.validateAsync(req.body);
      const skip = !req.body.skip ? 0 : parseInt(req.body.skip, 10);
      const limit = !req.body.limit ? 100 : parseInt(req.body.limit, 10);
      const { user_id, file_type, search } = req.body;

      let searchQuery = { user_id };
      console.log({ searchQuery });
      if (file_type) {
        searchQuery = { ...searchQuery, file_type };
      }
      /*
        example with all options
        {
            "file_type":"txt"
            "search":"van",
            "limit":1,
            "skip":0
        }
      */
      let result;
      if (search) {
        result = await templateModel
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
        result = await templateModel
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
        msg: "we were unable to search the templates",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-templates-by-userid",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await userIdSchema.validateAsync(req.body);
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const { user_id } = req.body;

      const result = await templateModel
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
        msg: "we were unable to GET the users templates",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-individual-template",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await templateModel
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
        msg: "we were unable to GET individual template",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/add-template",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await addTemplateSchema.validateAsync(req.body);

      const newContent = {
        user_id: req.body.user_id,
        label: req.body.label,
        file_url: req.body.file_url,
        file_type: req.body.file_type,
        tags: req.body.tags,
        original_filename: req.body.original_filename,
        saved_filename: req.body.saved_filename,
        custom_filename: req.body.custom_filename,
        metadata: req.body.metadata || {},
      };
      const template = await templateCreator(newContent);

      return res.json({
        error: false,
        template,
        msg: "template data added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert template data",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/delete-template",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await templateModel.findOneAndRemove({
        _id: id,
      });
      result
        ? res.json({ msg: `template ${id} has been deleted` })
        : res.json({ msg: `template ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

export default router;
