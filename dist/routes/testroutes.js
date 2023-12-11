"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const users_model_1 = require("./db/users-model");
const document_model_1 = require("./db/document-model");
const document_groups_model_1 = require("./db/document-groups-model");
const template_model_1 = require("./db/template-model");
const tags_model_1 = require("./db/tags-model");
const reports_model_1 = require("./db/reports-model");
const chat_history_model_1 = require("./db/chat-history-model");
const users_creator_1 = __importDefault(require("./db/users-creator"));
const router = (0, express_1.Router)();
const userID = "test";
router.post("/v1/admin/create-user", (0, nocache_1.default)(), async (req, res) => {
    try {
        const { email_address } = req.body;
        if (email_address !== "test@ningi.co.uk")
            return res.json({
                error: true,
                msg: "failure to create test user",
            });
        const result = await users_model_1.usersModel
            .findOne({
            uuid: "test12345",
        })
            .lean()
            .exec();
        if (result) {
            return res.json({
                error: true,
                msg: "test user exists",
            });
        }
        const newUser = {
            uuid: "test12345",
            email: email_address,
        };
        await (0, users_creator_1.default)(newUser);
        const updated = await users_model_1.usersModel.findOneAndUpdate({ uuid: "test12345" }, {
            uuid: "test12345",
            role: "admin",
        }, {
            new: true,
            upsert: false,
        });
        res.json(updated);
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert admin user",
        });
    }
});
router.post("/v1/admin/teardown", (0, nocache_1.default)(), async (req, res) => {
    try {
        console.log("teardown started");
        await document_model_1.documentModel.deleteMany({
            user_id: userID,
        });
        await document_groups_model_1.documentGroupsModel.deleteMany({
            user_id: userID,
        });
        await chat_history_model_1.chatHistoryModel.deleteMany({
            user_id: userID,
        });
        await template_model_1.templateModel.deleteMany({
            user_id: userID,
        });
        await tags_model_1.tagsModel.deleteMany({
            user_id: userID,
        });
        await reports_model_1.reportsModel.deleteMany({
            user_id: userID,
        });
        await users_model_1.usersModel.findOneAndRemove({
            uuid: "test12345",
        });
        return res.json({
            error: false,
            msg: "Teardown complete",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to complete the teardown",
        });
    }
});
exports.default = router;
