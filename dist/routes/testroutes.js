"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const nocache_1 = __importDefault(require("nocache"));
const users_model_1 = require("./db/users-model");
const users_creator_1 = __importDefault(require("./db/users-creator"));
const router = (0, express_1.Router)();
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
        // await likesModel.deleteMany({
        //   content_type: "tests",
        // });
        // await commentsModel.deleteMany({
        //   content_type: "tests",
        // });
        // await contentModel.deleteMany({
        //   type: "tests",
        // });
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
