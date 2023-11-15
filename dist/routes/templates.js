"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const template_model_1 = require("./db/template-model");
const template_creator_1 = __importDefault(require("./db/template-creator"));
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/get-all-templates", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const result = await template_model_1.templateModel
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
            msg: "we were unable to GET templates",
        });
    }
});
router.post("/v1/aiadviser/search-templates", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.searchTemplatesSchema.validateAsync(req.body);
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
            result = await template_model_1.templateModel
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
        }
        else {
            result = await template_model_1.templateModel
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
            msg: "we were unable to search the templates",
        });
    }
});
router.post("/v1/aiadviser/get-templates-by-userid", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.userIdSchema.validateAsync(req.body);
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const { user_id } = req.body;
        const result = await template_model_1.templateModel
            .find({ user_id })
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
            msg: "we were unable to GET the users templates",
        });
    }
});
router.post("/v1/aiadviser/get-individual-template", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await template_model_1.templateModel
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
            msg: "we were unable to GET individual template",
        });
    }
});
router.post("/v1/aiadviser/add-template", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.addTemplateSchema.validateAsync(req.body);
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
        const template = await (0, template_creator_1.default)(newContent);
        return res.json({
            error: false,
            template,
            msg: "template data added",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert template data",
        });
    }
});
router.delete("/v1/aiadviser/delete-template", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await template_model_1.templateModel.findOneAndRemove({
            _id: id,
        });
        result
            ? res.json({ msg: `template ${id} has been deleted` })
            : res.json({ msg: `template ${id} was not found` });
    }
    catch (e) {
        console.log(e);
        res.send({ error: e });
    }
});
exports.default = router;
