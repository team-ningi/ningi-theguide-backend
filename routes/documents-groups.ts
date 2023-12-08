// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { documentGroupsModel } from "./db/document-groups-model";
import documentGroupsCreator from "./db/document-groups-creator";
import { AuthenticateManageToken } from "./helper";
import {
  idSchema,
  updateDocGroupSchema,
  addDocumentGroupSchema,
  userIdSchema,
} from "./schemas";

const router = Router();

router.get(
  "/v1/aiadviser/get-all-document-groups",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const searchType = req.query.type ? { type: req.query.type } : {};

      const result = await documentGroupsModel
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
        msg: "we were unable to GET document groups",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-document-groups-by-userid",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await userIdSchema.validateAsync(req.body);
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const { user_id } = req.body;

      const result = await documentGroupsModel
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
        msg: "we were unable to GET the users document tags",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-individual-document-group",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await documentGroupsModel
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
        msg: "we were unable to GET individual document groups",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/update-document-group",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateDocGroupSchema.validateAsync(req.body);

      const { document_group_id, label, documentIds } = req.body;
      console.log("document_group_id", document_group_id);
      const data = await documentGroupsModel
        .find({
          _id: document_group_id,
        })
        .lean()
        .exec();

      if (!data.length) {
        return res.json({
          error: true,
          msg: "No document group found for the id",
        });
      }
      console.log("data ", data);
      const result = await documentGroupsModel.findByIdAndUpdate(
        { _id: data[0]?._id },
        {
          label,
          document_ids: documentIds,
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
        msg: "failed to update document group",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/add-document-group",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await addDocumentGroupSchema.validateAsync(req.body);

      const newContent = {
        user_id: req.body.user_id,
        label: req.body.label,
        document_ids: req.body.document_ids,
        metadata: req.body.metadata || {},
      };

      const group = await documentGroupsCreator(newContent);

      return res.json({
        error: false,
        group,
        msg: "document group data added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert document group data",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/delete-document-group",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await documentGroupsModel.findOneAndRemove({
        _id: id,
      });
      result
        ? res.json({ msg: `Document group ${id} has been deleted` })
        : res.json({ msg: `Document group ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

export default router;
