// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { reportsModel } from "./db/reports-model";
import reportsCreator from "./db/reports-creator";
import { AuthenticateManageToken, addToAudit } from "./helper";
import {
  idSchema,
  getReportsSchema,
  addReportSchema,
  searchReportsSchema,
  updateReportSchema,
  updateReportTagsDefinitionsSchema,
  updateReportOriginalTagsSchema,
  updateReportTagsProcessedSchema,
} from "./schemas";

const router = Router();

router.get(
  "/v1/aiadviser/get-all-reports",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);

      const result = await reportsModel
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
        msg: "we were unable to GET reports",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/search-reports",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await searchReportsSchema.validateAsync(req.body);
      const skip = !req.body.skip ? 0 : parseInt(req.body.skip, 10);
      const limit = !req.body.limit ? 100 : parseInt(req.body.limit, 10);
      const { user_id, file_type, report_type, search } = req.body;

      let searchQuery = { user_id };
      if (report_type !== "all") {
        searchQuery = { ...searchQuery, report_type };
      }
      if (file_type) {
        searchQuery = { ...searchQuery, file_type };
      }

      let result;
      if (search) {
        result = await reportsModel
          .aggregate([
            {
              $match: {
                $and: [
                  {
                    report_name: {
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
        result = await reportsModel
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
  "/v1/aiadviser/get-reports-by-userid",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await getReportsSchema.validateAsync(req.body);
      const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
      const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
      const { user_id } = req.body;

      const result = await reportsModel
        .find({ user_id, report_hidden: false })
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
        msg: "we were unable to GET the users reports",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/get-individual-report",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await reportsModel
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

router.post(
  "/v1/aiadviser/add-report",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await addReportSchema.validateAsync(req.body);

      const newReport = {
        user_id: req.body.user_id,
        initial_prompt: req.body.initial_prompt,
        report_name: req.body.report_name,
        report_type: req.body.report_type,
        file_type: req.body.file_type,
        tags: req.body.tags,
        tag_chunks_to_process: req.body.tag_chunks_to_process,
        template_definition: req.body.template_definition || {},
        tag_chunks_processed: req.body.tag_chunks_processed,
        tagResults: req.body.tagResults,
        base_template_url: req.body.base_template_url,
        generated_report_url: req.body.generated_report_url,
        generated_report: req.body.generated_report,
        document_ids: req.body.document_ids,
        report_hidden: req.body.report_hidden || false,
        metadata: req.body.metadata || {},
      };
      const report = await reportsCreator(newReport);

      return res.json({
        error: false,
        report,
        msg: "report data added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert report data",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/update-report-tags-processed",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateReportTagsProcessedSchema.validateAsync(req.body);

      const {
        user_id,
        report_id,
        tag_chunks_to_process,
        tag_chunks_processed,
      } = req.body;

      const report = await reportsModel
        .find({
          _id: report_id,
        })
        .lean()
        .exec();

      if (!report) {
        return res.json({
          error: true,
          msg: "No report found",
        });
      }
      // console.log({ report });

      const result = await reportsModel.findOneAndUpdate(
        { _id: report_id },
        {
          tag_chunks_to_process:
            tag_chunks_to_process || report[0]?.tag_chunks_to_process,
          tag_chunks_processed:
            tag_chunks_processed || report[0]?.tag_chunks_processed,
        },
        {
          new: true,
          upsert: false,
        }
      );

      const auditData = {
        user_id,
        action: "update_report_tags_processed",
        metadata: {
          user_id: user_id || report[0]?.user_id,
          tag_chunks_to_process:
            tag_chunks_to_process || report[0]?.tag_chunks_to_process,
          tag_chunks_processed:
            tag_chunks_processed || report[0]?.tag_chunks_processed,
        },
      };
      await addToAudit(req, auditData);

      res.json(result);
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to update report tag processed status",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/update-report",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateReportSchema.validateAsync(req.body);

      const { user_id, report_id, generated_report_url, generated_report } =
        req.body;

      const report = await reportsModel
        .find({
          _id: report_id,
        })
        .lean()
        .exec();

      if (!report) {
        return res.json({
          error: true,
          msg: "No report found",
        });
      }
      // console.log({ report });

      const result = await reportsModel.findOneAndUpdate(
        { _id: report_id },
        {
          generated_report_url:
            generated_report_url || report[0]?.generated_report_url,
          generated_report: generated_report || report[0]?.generated_report,
        },
        {
          new: true,
          upsert: false,
        }
      );

      const auditData = {
        user_id: user[0]?._id,
        action: "update_report",
        metadata: {
          user_id: user_id || report[0]?.user_id,
          generated_report_url:
            generated_report_url || report[0]?.generated_report_url,
          generated_report: generated_report || report[0]?.generated_report,
        },
      };
      await addToAudit(req, auditData);

      res.json(result);
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to update report",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/update-report-tags-and-definitions",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateReportTagsDefinitionsSchema.validateAsync(req.body);

      const { user_id, report_id, template_definition, tagResults } = req.body;

      const report = await reportsModel
        .find({
          _id: report_id,
        })
        .lean()
        .exec();

      if (!report) {
        return res.json({
          error: true,
          msg: "No report found",
        });
      }

      const result = await reportsModel.findOneAndUpdate(
        { _id: report_id },
        {
          template_definition:
            template_definition || report[0]?.template_definition,
          tagResults: tagResults || report[0]?.tagResults,
        },
        {
          new: true,
          upsert: false,
        }
      );

      const auditData = {
        user_id: user_id || report[0]?.user_id,
        action: "update_report_tags_and_definitions",
        metadata: {
          user_id: user_id || report[0]?.user_id,
          report_id: report_id,
          template_definition:
            template_definition || report[0]?.template_definition,
          tagResults: tagResults || report[0]?.tagResults,
        },
      };
      await addToAudit(req, auditData);

      res.json(result);
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to update report tags and definitions",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/set-original-tag-results",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateReportOriginalTagsSchema.validateAsync(req.body);

      const { user_id, report_id, tagResults } = req.body;

      const report = await reportsModel
        .find({
          _id: report_id,
        })
        .lean()
        .exec();

      if (!report) {
        return res.json({
          error: true,
          msg: "No report found",
        });
      }

      const result = await reportsModel.findOneAndUpdate(
        { _id: report_id },
        {
          tagResultsOriginal: tagResults || report[0]?.tagResults,
        },
        {
          new: true,
          upsert: false,
        }
      );

      const auditData = {
        user_id: user_id || report[0]?.user_id,
        action: "update_report_original_tags",
        metadata: {
          user_id: user_id || report[0]?.user_id,
          report_id: report_id,
          tagResultsOriginal: tagResults || report[0]?.tagResults,
        },
      };
      await addToAudit(req, auditData);

      res.json({
        error: false,
        msg: "set original tags",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to update report tags and definitions",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/hide-report",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const report = await reportsModel
        .find({
          _id: id,
        })
        .lean()
        .exec();

      if (!report) {
        return res.json({
          error: true,
          msg: "No report found for the id",
        });
      }

      const result = await reportsModel.findOneAndUpdate(
        { _id: id },
        {
          report_hidden: true,
        },
        {
          new: true,
          upsert: false,
        }
      );
      res.json(result);
      result
        ? res.json({ msg: `Report ${id} has been hidden` })
        : res.json({ msg: `Report ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

export default router;
