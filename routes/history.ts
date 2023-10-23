// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { chatHistoryModel } from "./db/chat-history-model";
import chatHistoryCreator from "./db/chat-history-creator";
import { AuthenticateManageToken } from "./helper";
import {
  updateHistorySchema,
  userIdSchema,
  addHistorySchema,
  idSchema,
} from "./schemas";

const router = Router();

router.get(
  "/v1/aiadviser/get-all-history",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const searchType = req.query.type ? { type: req.query.type } : {};

      const result = await chatHistoryModel
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
        msg: "we were unable to GET history",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-users-history",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await userIdSchema.validateAsync(req.body);

      const id = req.body.user_id;
      const result = await chatHistoryModel
        .findOne({
          user_id: id,
        })
        .lean()
        .exec();

      result ? res.json(result) : res.json([]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to GET users history",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/create-history",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await addHistorySchema.validateAsync(req.body);

      const newHistory = {
        user_id: req.body.user_id,
        history: req.body.history,
        metadata: req.body.metadata || {},
      };
      const document = await chatHistoryCreator(newHistory);

      return res.json({
        error: false,
        document,
        msg: "history data added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert history data",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/update-history",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateHistorySchema.validateAsync(req.body);

      const { user_id, history, metadata = {} } = req.body;

      const historyData = await chatHistoryModel
        .find({
          user_id,
        })
        .lean()
        .exec();

      if (!historyData) {
        return res.json({
          error: true,
          msg: "No history found",
        });
      }

      const result = await chatHistoryModel.findOneAndUpdate(
        { user_id },
        {
          history,
          metadata,
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
        msg: "failed to update history",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/delete-history",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await chatHistoryModel.findOneAndRemove({
        _id: id,
      });
      result
        ? res.json({ msg: `History ${id} has been deleted` })
        : res.json({ msg: `History ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

export default router;
