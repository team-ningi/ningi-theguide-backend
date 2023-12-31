// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { usersModel } from "./db/users-model";
import usersCreator from "./db/users-creator";
import { AuthenticateManageToken, addToAudit } from "./helper";
import {
  uuidSchema,
  updateUserSchema,
  idSchema,
  uuidAndEmailSchema,
} from "./schemas";

const router = Router();

router.get("/v1/aiadviser/get-users", nocache(), async (req, res) => {
  try {
    const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
    const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);

    const result = await usersModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ $natural: -1 })
      .exec();

    res.json(result);
  } catch (e) {
    console.log(e);
    res.send({
      status: "error",
      error: e,
      msg: "we were unable to GET all the users",
    });
  }
});

router.post(
  "/v1/aiadviser/get-individual-user",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await uuidSchema.validateAsync(req.body);

      const result = await usersModel.find({ uuid: req.body.uuid }).exec();

      result ? res.json(result[0]) : res.json([]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to GET individual user",
      });
    }
  }
);

router.put(
  "/v1/aiadviser/update-user",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await updateUserSchema.validateAsync(req.body);

      const {
        email,
        first_name,
        last_name,
        phone_number,
        address_line1,
        address_line2,
        address_line3,
        address_line4,
        role,
        company,
        superUser,
        uuid,
        metadata,
      } = req.body;

      const user = await usersModel
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
      const isSuperUser =
        superUser === undefined ? user[0]?.superUser : superUser;

      const returnValue = (string) => (string ? string : " ");

      const result = await usersModel.findOneAndUpdate(
        { uuid },
        {
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
        },
        {
          new: true,
          upsert: false,
        }
      );

      const auditData = {
        user_id: user[0]?._id,
        action: "update_user",
        metadata: {
          uuid,
          metadata: metadata || user[0]?.metadata,
        },
      };
      await addToAudit(req, auditData);

      res.json(result);
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to update user",
      });
    }
  }
);

router.post(
  "/v1/aiadviser/create-user",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await uuidAndEmailSchema.validateAsync(req.body);

      const result = await usersModel
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
      await usersCreator(newUser);

      return res.json({
        error: false,
        msg: "user added",
      });
    } catch (e) {
      console.log(e);
      return res.json({
        error: true,
        msg: "failed to insert user",
      });
    }
  }
);

router.delete(
  "/v1/aiadviser/delete-user",
  nocache(),
  AuthenticateManageToken(),
  async (req, res) => {
    try {
      await idSchema.validateAsync(req.body);

      const id = req.body.id;
      const result = await usersModel.findOneAndRemove({
        _id: id,
      });
      result
        ? res.json({ msg: `User ${id} has been deleted` })
        : res.json({ msg: `User ${id} was not found` });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  }
);

export default router;
