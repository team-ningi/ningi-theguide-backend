"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const chat_history_model_1 = require("./db/chat-history-model");
const chat_history_creator_1 = __importDefault(require("./db/chat-history-creator"));
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/get-all-history", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const searchType = req.query.type ? { type: req.query.type } : {};
        const result = await chat_history_model_1.chatHistoryModel
            .find(searchType)
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
            msg: "we were unable to GET history",
        });
    }
});
router.post("/v1/aiadviser/get-users-history", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.userIdSchema.validateAsync(req.body);
        const id = req.body.user_id;
        const result = await chat_history_model_1.chatHistoryModel
            .findOne({
            user_id: id,
        })
            .lean()
            .exec();
        result ? res.json(result) : res.json([]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET users history",
        });
    }
});
router.post("/v1/aiadviser/create-history", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.addHistorySchema.validateAsync(req.body);
        const newHistory = {
            user_id: req.body.user_id,
            history: req.body.history,
            metadata: req.body.metadata || {},
        };
        const document = await (0, chat_history_creator_1.default)(newHistory);
        return res.json({
            error: false,
            document,
            msg: "history data added",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert history data",
        });
    }
});
router.put("/v1/aiadviser/update-history", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.updateHistorySchema.validateAsync(req.body);
        const { user_id, history, metadata = {} } = req.body;
        const historyData = await chat_history_model_1.chatHistoryModel
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
        const result = await chat_history_model_1.chatHistoryModel.findOneAndUpdate({ user_id }, {
            history,
            metadata,
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
            msg: "failed to update history",
        });
    }
});
router.delete("/v1/aiadviser/delete-history", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await chat_history_model_1.chatHistoryModel.findOneAndRemove({
            _id: id,
        });
        result
            ? res.json({ msg: `History ${id} has been deleted` })
            : res.json({ msg: `History ${id} was not found` });
    }
    catch (e) {
        console.log(e);
        res.send({ error: e });
    }
});
exports.default = router;
