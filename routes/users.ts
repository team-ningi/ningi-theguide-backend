// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { usersModel } from "./db/users-model";
import usersCreator from "./db/users-creator";
import { AuthenticateManageToken } from "./helper";
import {
  emailSchema,
  updateUserSchema,
  idSchema,
  emailAddressSchema,
} from "./schemas";

const router = Router();

router.get("/v1/aiadviser/get-users", nocache(), async (req, res) => {
  try {
    const skip = !req.query.skip ? 0 : parseInt(req.query.skip, 10);
    const limit = !req.query.limit ? 100 : parseInt(req.query.limit, 10);

    const result = await usersModel
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
      await emailSchema.validateAsync(req.body);

      const email = req.body.email;
      const result = await usersModel
        .findOne({
          email,
        })
        .lean()
        .exec();

      result ? res.json([result]) : res.json([]);
    } catch (e) {
      console.log(e);
      res.send({
        status: "error",
        error: e,
        msg: "we were unable to GET individual users",
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
        first_name,
        last_name,
        phone_number,
        address_line1,
        address_line2,
        address_line3,
        role,
        email_address: email,
        metadata = {},
      } = req.body;

      const user = await usersModel
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

      const result = await usersModel.findOneAndUpdate(
        { email },
        {
          email,
          first_name,
          last_name,
          phone_number,
          address_line1,
          address_line2,
          address_line3,
          role,
          metadata,
        },
        {
          new: true,
          upsert: false,
        }
      );
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
      await emailAddressSchema.validateAsync(req.body);

      const result = await usersModel
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
      const user = await usersCreator(newUser);
      return res.json({
        error: false,
        user,
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
