"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const tags_model_1 = require("./db/tags-model");
const tags_creator_1 = __importDefault(require("./db/tags-creator"));
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/get-all-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const result = await tags_model_1.tagsModel
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
            msg: "we were unable to GET tags",
        });
    }
});
router.post("/v1/aiadviser/get-tags-by-userid", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.userIdSchema.validateAsync(req.body);
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const { user_id } = req.body;
        const result = await tags_model_1.tagsModel
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
            msg: "we were unable to GET the users tags",
        });
    }
});
router.post("/v1/aiadviser/get-individual-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await tags_model_1.tagsModel
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
            msg: "we were unable to GET individual tags",
        });
    }
});
router.post("/v1/aiadviser/add-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.addTagsSchema.validateAsync(req.body);
        const newContent = {
            user_id: req.body.user_id,
            label: req.body.label,
            tags: req.body.tags,
            metadata: req.body.metadata || {},
        };
        const tags = await (0, tags_creator_1.default)(newContent);
        return res.json({
            error: false,
            tags,
            msg: "tags data added",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert tags",
        });
    }
});
router.put("/v1/aiadviser/update-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.updateTagsSchema.validateAsync(req.body);
        const { id, label, tags, metadata = {} } = req.body;
        const result = await tags_model_1.tagsModel.findOneAndUpdate({ _id: id }, {
            label,
            tags,
            metadata: metadata,
        }, {
            new: true,
            upsert: false,
        });
        res.json(result);
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to update tags",
        });
    }
});
router.delete("/v1/aiadviser/delete-tags", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await tags_model_1.tagsModel.findOneAndRemove({
            _id: id,
        });
        result
            ? res.json({ msg: `tags ${id} has been deleted` })
            : res.json({ msg: `tags ${id} was not found` });
    }
    catch (e) {
        console.log(e);
        res.send({ error: e });
    }
});
exports.default = router;
