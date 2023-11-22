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
            .skip(skip)
            .limit(limit)
            .sort({ $natural: -1 })
            .exec();
        res.json(result);
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
        await schemas_1.uuidSchema.validateAsync(req.body);
        const result = await users_model_1.usersModel.find({ uuid: req.body.uuid }).exec();
        result ? res.json(result[0]) : res.json([]);
    }
    catch (e) {
        console.log(e);
        res.send({
            status: "error",
            error: e,
            msg: "we were unable to GET individual user",
        });
    }
});
router.put("/v1/aiadviser/update-user", (0, nocache_1.default)(), (0, helper_1.AuthenticateManageToken)(), async (req, res) => {
    try {
        await schemas_1.updateUserSchema.validateAsync(req.body);
        const { email, first_name, last_name, phone_number, address_line1, address_line2, address_line3, address_line4, role, company, superUser, uuid, metadata, } = req.body;
        const user = await users_model_1.usersModel
            .find({
            uuid,
        })
            .lean()
            .exec();
        if (!user) {
            return res.json({
                error: true,
                msg: "No user found",
            });
        }
        console.log({ user });
        const isSuperUser = superUser === undefined ? user[0]?.superUser : superUser;
        const returnValue = (string) => (string ? string : " ");
        const result = await users_model_1.usersModel.findOneAndUpdate({ uuid }, {
            uuid,
            first_name: first_name || returnValue(user[0]?.first_name),
            last_name: last_name || returnValue(user[0]?.last_name),
            phone_number: phone_number || returnValue(user[0]?.phone_number),
            address_line1: address_line1 || returnValue(user[0]?.address_line1),
            address_line2: address_line2 || returnValue(user[0]?.address_line2),
            address_line3: address_line3 || returnValue(user[0]?.address_line3),
            address_line4: address_line4 || returnValue(user[0]?.address_line4),
            company: company || returnValue(user[0]?.company),
            role: role || user[0]?.role || "",
            superUser: isSuperUser,
            metadata: metadata || user[0]?.metadata,
        }, {
            new: true,
            upsert: false,
        });
        // const auditData = {
        //   user_id: user[0]?._id,
        //   action: "update_user",
        //   metadata: {
        //     uuid,
        //     metadata: metadata || user[0]?.metadata,
        //   },
        // };
        // await addToAudit(req, auditData);
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
        await schemas_1.uuidAndEmailSchema.validateAsync(req.body);
        const result = await users_model_1.usersModel
            .findOne({
            uuid: req.body.uuid,
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
            uuid: req.body.uuid,
            email: req.body.email,
        };
        await (0, users_creator_1.default)(newUser);
        return res.json({
            error: false,
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
