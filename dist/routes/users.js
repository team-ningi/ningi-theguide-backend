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
const helper_1 = require("./helper");
const schemas_1 = require("./schemas");
const router = (0, express_1.Router)();
router.get("/v1/aiadviser/get-users", (0, nocache_1.default)(), async (req, res) => {
    try {
        const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
        const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);
        const result = await users_model_1.usersModel
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
            msg: "we were unable to GET all the users",
        });
    }
});
router.post("/v1/aiadviser/get-individual-user", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.emailSchema.validateAsync(req.body);
        const email = req.body.email;
        const result = await users_model_1.usersModel
            .findOne({
            email,
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
            msg: "we were unable to GET individual users",
        });
    }
});
router.put("/v1/aiadviser/update-user", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.updateUserSchema.validateAsync(req.body);
        const { first_name, last_name, phone_number, address_line1, address_line2, address_line3, role, email_address: email, metadata = {}, } = req.body;
        const user = await users_model_1.usersModel
            .find({
            email,
        })
            .lean()
            .exec();
        if (!user) {
            return res.json({
                error: true,
                msg: "No user found for the email address",
            });
        }
        const result = await users_model_1.usersModel.findOneAndUpdate({ email }, {
            email,
            first_name,
            last_name,
            phone_number,
            address_line1,
            address_line2,
            address_line3,
            role,
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
            msg: "failed to update user",
        });
    }
});
router.post("/v1/aiadviser/create-user", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.emailAddressSchema.validateAsync(req.body);
        const result = await users_model_1.usersModel
            .findOne({
            email: req.body.email_address,
        })
            .lean()
            .exec();
        if (result) {
            return res.json({
                error: true,
                msg: "user exists",
            });
        }
        const newUser = {
            email: req.body.email_address,
        };
        const user = await (0, users_creator_1.default)(newUser);
        return res.json({
            error: false,
            user,
            msg: "user added",
        });
    }
    catch (e) {
        console.log(e);
        return res.json({
            error: true,
            msg: "failed to insert user",
        });
    }
});
router.delete("/v1/aiadviser/delete-user", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.idSchema.validateAsync(req.body);
        const id = req.body.id;
        const result = await users_model_1.usersModel.findOneAndRemove({
            _id: id,
        });
        result
            ? res.json({ msg: `User ${id} has been deleted` })
            : res.json({ msg: `User ${id} was not found` });
    }
    catch (e) {
        console.log(e);
        res.send({ error: e });
    }
});
exports.default = router;
