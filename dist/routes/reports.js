"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const reports_model_1 = require("./db/reports-model");
const reports_creator_1 = __importDefault(require("./db/reports-creator"));
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/get-all-reports", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const result = await reports_model_1.reportsModel
            .find()
            .lean()
            .skip(skip)
            .limit(limit)
            .sort({ $natural: -1 })
            .exec();
        res.json([...result]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET reports",
        });
    }
});
router.post("/v1/aiadviser/search-reports", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.searchReportsSchema.validateAsync(req.body);
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
            result = await reports_model_1.reportsModel
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
        }
        else {
            result = await reports_model_1.reportsModel
                .find({ ...searchQuery })
                .lean()
                .skip(skip)
                .limit(limit)
                .sort({ $natural: -1 })
                .exec();
        }
        result ? res.json(result) : res.json([]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to search the documents",
        });
    }
});
router.post("/v1/aiadviser/get-reports-by-userid", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.getReportsSchema.validateAsync(req.body);
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const { user_id } = req.body;
        const result = await reports_model_1.reportsModel
            .find({ user_id, report_hidden: false })
            .lean()
            .skip(skip)
            .limit(limit)
            .sort({ $natural: -1 })
            .exec();
        result ? res.json(result) : res.json([]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET the users reports",
        });
    }
});
router.post("/v1/aiadviser/get-individual-report", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await reports_model_1.reportsModel
            .findOne({
            _id: id,
        })
            .lean()
            .exec();
        result ? res.json([result]) : res.json([]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET individual document",
        });
    }
});
router.post("/v1/aiadviser/add-report", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.addReportSchema.validateAsync(req.body);
        const newReport = {
            user_id: req.body.user_id,
            initial_prompt: req.body.initial_prompt,
            report_name: req.body.report_name,
            report_type: req.body.report_type,
            file_type: req.body.file_type,
            tags: req.body.tags,
            tag_chunks_to_process: req.body.tag_chunks_to_process,
            tag_chunks_processed: req.body.tag_chunks_processed,
            tagResults: req.body.tagResults,
            base_template_url: req.body.base_template_url,
            generated_report_url: req.body.generated_report_url,
            generated_report: req.body.generated_report,
            document_ids: req.body.document_ids,
            report_hidden: req.body.report_hidden || false,
            metadata: req.body.metadata || {},
        };
        const report = await (0, reports_creator_1.default)(newReport);
        return res.json({
            error: false,
            report,
            msg: "report data added",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert report data",
        });
    }
});
router.put("/v1/aiadviser/update-report-tags-processed", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.updateReportTagsProcessedSchema.validateAsync(req.body);
        const { user_id, report_id, tag_chunks_to_process, tag_chunks_processed, } = req.body;
        const report = await reports_model_1.reportsModel
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
        console.log({ report });
        const result = await reports_model_1.reportsModel.findOneAndUpdate({ _id: report_id }, {
            tag_chunks_to_process: tag_chunks_to_process || report[0]?.tag_chunks_to_process,
            tag_chunks_processed: tag_chunks_processed || report[0]?.tag_chunks_processed,
        }, {
            new: true,
            upsert: false,
        });
        const auditData = {
            user_id,
            action: "update_report_tags_processed",
            metadata: {
                user_id: user_id || report[0]?.user_id,
                tag_chunks_to_process: tag_chunks_to_process || report[0]?.tag_chunks_to_process,
                tag_chunks_processed: tag_chunks_processed || report[0]?.tag_chunks_processed,
            },
        };
        await (0, helper_1.addToAudit)(req, auditData);
        res.json(result);
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to update report tag processed status",
        });
    }
});
router.put("/v1/aiadviser/update-report", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.updateReportSchema.validateAsync(req.body);
        const { user_id, report_id, generated_report_url, generated_report } = req.body;
        const report = await reports_model_1.reportsModel
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
        console.log({ report });
        const result = await reports_model_1.reportsModel.findOneAndUpdate({ _id: report_id }, {
            generated_report_url: generated_report_url || report[0]?.generated_report_url,
            generated_report: generated_report || report[0]?.generated_report,
        }, {
            new: true,
            upsert: false,
        });
        const auditData = {
            user_id: user[0]?._id,
            action: "update_report",
            metadata: {
                user_id: user_id || report[0]?.user_id,
                generated_report_url: generated_report_url || report[0]?.generated_report_url,
                generated_report: generated_report || report[0]?.generated_report,
            },
        };
        await (0, helper_1.addToAudit)(req, auditData);
        res.json(result);
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to update report",
        });
    }
});
router.delete("/v1/aiadviser/hide-report", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const report = await reports_model_1.reportsModel
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
        const result = await reports_model_1.reportsModel.findOneAndUpdate({ _id: id }, {
            report_hidden: true,
        }, {
            new: true,
            upsert: false,
        });
        res.json(result);
        result
            ? res.json({ msg: `Report ${id} has been hidden` })
            : res.json({ msg: `Report ${id} was not found` });
    }
    catch (e) {
        console.log(e);
        res.send({ error: e });
    }
});
exports.default = router;
